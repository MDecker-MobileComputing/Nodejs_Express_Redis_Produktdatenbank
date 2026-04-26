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
  return redisClient.incr( zaehlerName );
}


/**
 * Inkrementiert den "Produkt nicht gefunden"-Zähler.
 * 
 * @returns {Promise<number>} Aktueller Wert des "Produkt nicht gefunden"-Zählers 
 *                            nach Inkrementierung
 */
export async function inkrementProduktNichtGefundenZaehler() {

  return redisClient.incr( "produktNichtGefunden" );
}


/**
 * Alle Zählerwerte für Produktaufrufe abrufen. Hierzu werden alle Keys, die mit
 * `"produktaufrufe:` beginnen, abgefragt und die zugehörigen Werte ausgelesen.
 * 
 * @returns {Promise<Object>} Objekt mit Key-Value-Paaren aller Produktaufrufe.
 *                            Beispiel, wenn es nur Produkte mit den Nummern `111` und `222` gibt:
 *                            `{ "111": 42, "222": 7 }`;
 *                            Objekt kann leer sein (aber nicht `null`), wenn es noch überhaupt
 *                            keine Produktaufrufe gibt.
 */
export async function getAllProduktaufrufe() {
  
  const schluesselArray = 
      await redisClient.keys( "produktaufrufe:*" );
  
  if ( schluesselArray.length === 0 ) {

    return {};
  }
  
  const werteArray = 
      await redisClient.mGet( schluesselArray );  
  
  const ergebnisObjekt = {};
  for ( let i = 0; i < schluesselArray.length; i++ ) {

    const key  = schluesselArray[i].split( ":" )[ 1 ];
    const wert = werteArray[i];
    ergebnisObjekt[ key ] = parseInt( wert );
  }
  
  return ergebnisObjekt;
}
