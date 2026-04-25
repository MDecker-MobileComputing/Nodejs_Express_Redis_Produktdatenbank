import createLogger      from "logging";

import { ProduktRecord } from "./produkt.js";


const logger = createLogger( "datenbank" );


/**
 * "Datenbank" für die Produktdaten. Die Keys in der Map sind die Produktnummern, 
 * die Values sind ProduktRecord-Objekte.
 */
const produktMap = {};


/**
 * Fügt ein Produkt zur Datenbank hinzu.
 */
function addProdukt( produktNummer, produktTitel, produktBeschreibung, preis ) {

    const produktRecord = 
            new ProduktRecord( produktNummer, produktTitel, produktBeschreibung, preis );

    produktMap[ produktNummer ] = produktRecord;
    logger.info( `Produkt hinzugefügt: ${produktNummer} - ${produktTitel}` );
}


/**
 * Holt ein Produkt aus der Datenbank.
 * 
 * @param {number} produktNummer 
 * 
 * @returns Objekt der Klasse `ProduktRecord` oder `null`, 
 *          wenn kein Produkt mit der übergebenen Nummer 
 *         gefunden wurde.
 */
export function getProdukt( produktNummer ) {

    const produktRecord = produktMap[ produktNummer ];
    if ( produktRecord ) {

        logger.info( `Produkt mit Nr ${produktNummer} gefunden: ${produktRecord.produktTitel}` );
        return produktRecord;

    } else {

        logger.info( `Produkt mit Nr ${produktNummer} nicht gefunden.` );
        return null;
    }
}


addProdukt( 111, "Lufthaken"          , "10er-Pack der bewährten Lufthaken von Siemens"             ,  99.99 );
addProdukt( 222, "Getriebesand"       , "Feinkörnig, im 10kg Sack"                                  ,   5.49 );
addProdukt( 333, "Feierabendschablone", "Unverzichtbares Utensil für jede Behörde"                  ,   9.95 );
addProdukt( 444, "Luftgitarre"        , "Hochwertiges Instrument mit klassischer Single-Cut-Bauform", 990.00 );
addProdukt( 555, "Trockenfugen"       , "Packung mit 100 Stück"                                     ,  19.95 );
// weitere Produkte dieser Art: https://etel-tuning.eu/

logger.info( `Anzahl Produkte in der Datenbank: ${Object.keys(produktMap).length}` );