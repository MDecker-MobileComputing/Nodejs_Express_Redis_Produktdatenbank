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
                    on( "connect",      () => logger.info( "Verbindung zum Redis-Server wird aufgebaut ..." ) ).
                    on( "ready",        () => logger.info( "Verbindung zum Redis-Server hergestellt." ) ).
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
