import createLogger from "logging";

import { getProdukt } from "./datenbank.js";

import { 
         inkrementPageImpressionZaehler, 
         inkrementProduktNichtGefundenZaehler,
         getAllProduktaufrufe 
       } from "./redis-client.js";

import { umrechnungEuroInFremdwaehrung } from "./umrechnung.js";     

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

    const pfad3 = "/umrechnen/:waehrung/:euroBetrag";
    expressObjekt.get( pfad3, getUmrechnung );
    logger.info( `Route registriert: GET ${pfad3}` );
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
            preisEuro   : produkt.preis,
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
            seitentitel: "Ranking der Produktaufrufe",
            produktaufrufe: produktaufrufe
    });
}


/**
 * Callback-Funktion für GET-Request zum Umrechnen von Euro-Beträgen in andere Währungen.
 * 
 * @param {*} request Request mit Pfadparametern `waehrung` (z.B. "USD") und 
 *                    `euroBetrag` (z.B. "100.00")
 * 
 * @param {*} response Template "preis_umgerechnet" rendern mit übergebenen Parametern:
 *                     - preisEuro: übergebenen Euro-Betrag (z.B. 119.99)
 *                     - preisFremd: umgerechneten Betrag in Fremdwährung
 *                     - fremdwaehrung: übergebenen Währungs-Code (z.B. "USD")
 */
async function getUmrechnung( request, response ) {

    const waehrung = request.params.waehrung.toUpperCase(); // z.B. "USD"

    const euroBetragString = request.params.euroBetrag; // z.B. "119.99"
    const euroBetrag       = parseFloat( euroBetragString );

    const preisFremd = 
                await umrechnungEuroInFremdwaehrung( euroBetrag, waehrung );

    if ( !preisFremd ) {

        response.render( "fehler", {
            seitentitel: "Fehler bei Umrechnung von Euro in Fremdwährung",
            fehlermeldung: `Die Umrechnung von ${euroBetrag} EUR in ${waehrung} ist fehlgeschlagen.`
        });
     
    } else {

        response.render( "preis_umgerechnet", {
                seitentitel: "Preis in Fremdwährung",
                preisEuro    : euroBetrag,
                preisFremd   : preisFremd,
                fremdwaehrung: waehrung
        });
    }
}
