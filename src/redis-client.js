import { createClient } from "redis";
import createLogger     from "logging";

import { routenRegistrieren } from "./controller.js";

const logger = createLogger( "redis-client" );


/** API-Objekt für Kommunikation mit Redis-Server */
let redisClient = null;


/**
 * Verbindung zu Redis-Server aufbauen.  
 */
export async function initRedisClient() {

  logger.info( "Initialisierung Redis-Client ..." );

  redisClient 
          = await createClient().
                    on( "error",        (fehler) => logger.info(( `Fehler bei Aufbau Verbindung zu Redis-Server: ${fehler}`) ).
                    on( "connect",      () => logger.info( "Verbindung zum Redis-Server wird aufgebaut ..." ) ). // funktioniert nicht?
                    on( "ready",        () => logger.info( "Verbindung zum Redis-Server hergestellt." ) ).       // funktioniert nicht?
                    on( "reconnecting", () => logger.info( "Verbindung zum Redis-Server wird wiederhergestellt ..." ) ).
                    on( "end",          () => logger.info( "Verbindung zum Redis-Server wurde geschlossen." ) ) ).
                    connect();
}


/**
 * Inkrementiert den Page-Impression-Zähler für ein spezifisches Produkt.
 * 
 * @param {number} produktNr Nummer des Produkts, für das der Page-Impression-Zähler 
 *                           inkrementiert werden soll
 *  
 * @returns {Promise<number>} Aktueller Wert des Page-Impression-Zählers nach Inkrementierung 
 */
export async function inkrementPageImpressionZaehler( produktNr ) {
  
  const zaehlerName = `produktaufrufe:${produktNr}`;
  return await redisClient.incr( zaehlerName );
}


/**
 * Inkrementiert den "Produkt nicht gefunden"-Zähler.
 * 
 * @returns {Promise<number>} Aktueller Wert des "Produkt nicht gefunden"-Zählers 
 *                            nach Inkrementierung
 */
export async function inkrementProduktNichtGefundenZaehler() {

  return await redisClient.incr( "produktNichtGefunden" );
}


/**
 * Alle Zählerwerte für Produktaufrufe abrufen. Hierzu werden alle Keys, die mit
 * `"produktaufrufe:` beginnen, abgefragt und die zugehörigen Werte ausgelesen.
 * 
 * @returns {Promise<Array>} 2-dimensionaler Array aller Produktaufrufe.
 *                           Jedes Element ist ein Array mit zwei Komponenten:
 *                           Index 0: Produktnummer (String), Index 1: Anzahl Aufrufe (Number).
 *                           Beispiel, wenn es nur Produkte mit den Nummern `111` und `222` gibt:
 *                           `[ [111, 42], [222, 7] ]`;
 *                           Array kann leer sein, wenn es noch überhaupt keine Produktaufrufe gibt.
 */
export async function getAllProduktaufrufe() {
  
  const schluesselArray = 
      await redisClient.keys( "produktaufrufe:*" );
  
  if ( schluesselArray.length === 0 ) {

    return [];
  }
  
  const werteArray = 
      await redisClient.mGet( schluesselArray );  
  
  const ergebnisArray = [];
  for ( let i = 0; i < schluesselArray.length; i++ ) {

    const schluessel      = schluesselArray[i];
    const produktNrString = schluessel.split( ":" )[ 1 ];
    const produktNrNumber = parseInt( produktNrString );

    const anzahlAufrufString = werteArray[i];
    const anzahlAufrufNumber = parseInt( anzahlAufrufString );

    const zweierArray = [ produktNrNumber, anzahlAufrufNumber ];
    ergebnisArray.push( zweierArray );
  }
  
 // Array nach Zahl in erster Komponente sortieren, d.h. nach Produktnummern aufsteigend sortieren
  ergebnisArray.sort( ( a, b ) => a[0] - b[0] );

  return ergebnisArray;
}
 

/**
 * Ruft den Wechselkurs für eine spezifische Fremdwährung aus dem Cache ab.
 * 
 * @param {string} fremdwaehrung, z.B. "USD" oder "GBP", muss auf Großbuchstaben normiert sein
 * 
 * @returns Wechselkurs von Euro in angegebene Fremdwährung (cache hit) oder `NaN`, wenn kein Wechselkurs 
 *          im Cache gefunden wurde (cache miss)
 */
export async function getWechselkurs( fremdwaehrung ) {

  const cacheKey = `umrechnungskurs:${fremdwaehrung}`;
  return await redisClient.get( cacheKey );
}


/**
 * Speichert den Wechselkurs für eine spezifische Fremdwährung im Cache.
 * Der Wert wird 24 Stunden lang im Cache gehalten, danach verfällt er automatisch, weil
 * die Frankfurter-API nur tagesaktuelle Wechselkurse liefert.
 * 
 * @param {string} fremdwaehrung, z.B. "USD" oder "GBP", muss auf Großbuchstaben normiert sein
 * 
 * @param {number} wechselkurs Wechselkurs von Euro in die angegebene Fremdwährung
 * 
 * @returns {Promise<boolean>} `true`, wenn der Wechselkurs erfolgreich im Cache gespeichert wurde, sonst `false`
 */
export async function setWechselkurs( fremdwaehrung, wechselkurs ) {

  const cacheKey = `umrechnungskurs:${fremdwaehrung}`;

  const cacheKonfig = { EX: 24*3600 }; // EX: Expire time in seconds, hier: 24 Stunden
                            
  return await redisClient.set( 
                          cacheKey, 
                          wechselkurs.toString(), 
                          cacheKonfig );
}