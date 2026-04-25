import createLogger from "logging";


const logger = createLogger( "controller" );


/**
 * Routen registrieren.
 *
 * @param expressObjekt App-Objekt von Express.js
 */
export function routenRegistrieren( expressObjekt ) {

    const pfad = "/p/:produktnr";
    expressObjekt.get( pfad, getProduktdaten );
    logger.info(`Route registriert: GET ${pfad}`);
};


/**
 * Callback-Funktion für GET-Request zum Abruf der Produktdetails.
 */
function getProduktdaten( request, response ) {

    const produktNummer = request.params.produktnr;

    response.render( "gefunden", {
        produktnr: produktNummer
    });

}
