import createLogger from "logging";

import { getProdukt } from "./datenbank.js";
import { inkrementPageImpressionZaehler, 
         inkrementProduktNichtGefundenZaehler } from "./redis-client.js";

const logger = createLogger( "controller" );


/**
 * Routen registrieren.
 *
 * @param expressObjekt App-Objekt von Express.js
 */
export function routenRegistrieren( expressObjekt ) {

    const pfad = "/p/:produktnr";
    expressObjekt.get( pfad, getProduktdaten );
    logger.info( `Route registriert: GET ${pfad}` );
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
            produktnr   : produktNummer,
            titel       : produkt.produktTitel,
            beschreibung: produkt.produktBeschreibung,
            preis       : produkt.preis,
            zaehler     : zaehlerWert
        });

    } else {

        const zaehlerWert = await inkrementProduktNichtGefundenZaehler();
        logger.info( 
            `"Produkt nicht gefunden"-Zähler inkrementiert, aktueller Wert: ${zaehlerWert}` );

        response.render( "nicht_gefunden", {
            produktnr: produktNummer,
            zaehler  : zaehlerWert
        });        
    }
}
