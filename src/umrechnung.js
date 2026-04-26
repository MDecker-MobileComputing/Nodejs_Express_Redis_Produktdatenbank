import { FrankfurterClient } from "frankfurter-js";

import createLogger from "logging";

import { getWechselkurs, setWechselkurs } from "./redis-client.js";

const logger = createLogger( "umrechnung" );


/**
 * Client für diese REST-API: https://frankfurter.dev/
 */
const wechselkursClient = new FrankfurterClient();
logger.info( "Wechselkurs-Client für API https://frankfurter.dev/ initialisiert" );



/**
 * Methode zur Umrechnung von Euro-Beträgen in Fremdwährungen.
 * Es wird zuerst geschaut, ob der Umrechnungskurs für die angegebene Fremdwährung im Cache liegt.
 * 
 * @param {number} euroBetrag Euro-Betrag, der in Fremdwährung umgerechnet werden soll
 * 
 * @param {string} fremdwaehrung z.B. "USD", muss auf Großbuchstaben normiert sein;
 *                               Es werden nur "USD" und "GBP" unterstützt.
 * 
 * @return {number} umgerechneter Betrag in Fremdwährung oder NaN bei Fehler
 */
export async function umrechnungEuroInFremdwaehrung( euroBetrag, fremdwaehrung ) {

    if ( fremdwaehrung !== "USD" && fremdwaehrung !== "GBP" ) {

        logger.error( 
            `Unerwartete Fremdwährung: ${fremdwaehrung}. Es werden nur "USD" und "GBP" unterstützt.` );
        return NaN;
    }

    let wechselkurs = -1;

    const wechselkursAusCache = await getWechselkurs( fremdwaehrung );
    if ( wechselkursAusCache ) {

        logger.info( `Wechselkurs für ${fremdwaehrung} im Cache gefunden: ${wechselkursAusCache}` );
        wechselkurs = parseFloat( wechselkursAusCache );

    } else {

        logger.info( `Wechselkurs für ${fremdwaehrung} nicht im Cache gefunden. Abruf von API...` );

        const ergebnisArray = 
                await wechselkursClient.latest({
                            base  : "EUR",
                            quotes: [ fremdwaehrung ]
                });

        if ( !ergebnisArray || ergebnisArray.length === 0 ) {

            logger.error( `Keine Wechselkurse für ${fremdwaehrung} von API erhalten.` );
            return NaN;
        }

        const ergebnisObjekt = ergebnisArray[ 0 ];
        wechselkurs          = ergebnisObjekt.rate;        

        logger.info( `Wechselkurs für ${fremdwaehrung} von API erhalten: ${wechselkurs}` );

        await setWechselkurs( fremdwaehrung, wechselkurs );

        logger.info( `Wechselkurs für ${fremdwaehrung} in Cache gespeichert: ${wechselkurs}` );
    }

    // eigentliche Umrechnung
    const fremdBetrag = euroBetrag * wechselkurs;

    const fremdBetragGerundet = Math.round( fremdBetrag * 100 ) / 100; // alle Nachkommastellen nach der Dritten abschneiden

    logger.info( 
        `Umrechnung von ${euroBetrag} EUR in ${fremdwaehrung}: ${fremdBetragGerundet} ${fremdwaehrung}` );

    return fremdBetragGerundet;
}
