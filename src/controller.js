import createLogger from "logging";

import { getProdukt } from "./datenbank.js";

import { 
         inkrementPageImpressionZaehler, 
         inkrementProduktNichtGefundenZaehler,
         getAllProduktaufrufe 
       } from "./redis-client.js";

const logger = createLogger( "controller" );


/**
 * Routen registrieren.
 *
 * @param expressObjekt App-Objekt von Express.js
 */
export function routenRegistrieren( expressObjekt ) {

    const pfad1 = "/p/:produktnr";
    expressObjekt.get( pfad1, getProduktdaten );
    logger.info( `Route registriert: GET ${pfad1}` );

    const pfad2 = "/ranking";
    expressObjekt.get( pfad2, getProduktRanking );
    logger.info( `Route registriert: GET ${pfad2}` );
};


/**
 * Callback-Funktion für GET-Request zum Abruf der Produktdetails.
 */
async function getProduktdaten( request, response ) {

    const produktNummer = request.params.produktnr;

    const produkt = getProdukt( produktNummer );
    if ( produkt ) {

        const zaehlerWert = await inkrementPageImpressionZaehler( produktNummer );
        logger.info( 
            `Page-Impression-Zähler für Produkt ${produktNummer} inkrementiert, aktueller Wert: ${zaehlerWert}` );

        response.render( "gefunden", {
            seitentitel : `Details für Produkt mit Nr ${produktNummer}`,
            produktname : produkt.produktTitel,
            beschreibung: produkt.produktBeschreibung,
            preis       : produkt.preis,
            zaehler     : zaehlerWert
        });

    } else {

        const zaehlerWert = await inkrementProduktNichtGefundenZaehler();
        logger.info( 
            `"Produkt nicht gefunden"-Zähler inkrementiert, aktueller Wert: ${zaehlerWert}` );

        response.render( "nicht_gefunden", {
            seitentitel: `Produkt mit Nummer ${produktNummer} nicht gefunden`,
            zaehler  :  zaehlerWert
        });        
    }
}


/**
 * Callback-Funktion für GET-Request zum Abruf des Rankings der Produktaufrufe. 
 * 
 * @param {*} request Wird nicht ausgewertet
 * 
 * @param {*} response Template "ranking" rendern mit allen Produktaufrufen als 
 *                     Array von Arrays übergeben 
 */
async function getProduktRanking( request, response ) {

    const produktaufrufe = await getAllProduktaufrufe();

    response.render( "ranking", {
            produktaufrufe: produktaufrufe
    });
}
