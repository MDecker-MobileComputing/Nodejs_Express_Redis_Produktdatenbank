import express         from "express";
import expressNunjucks from "express-nunjucks";
import createLogger    from "logging";

import { routenRegistrieren } from "./controller.js";

const logger = createLogger( "main" );


const PORTNUMMER = process.env.PORTNUMMER || 8080;
if ( isNaN( PORTNUMMER ) ) {

  logger.error( `FEHLER: Portnummer "${PORTNUMMER}" ist keine Zahl, Abbruch!` );
  console.log();
  process.exit( 1 );
}


const expressObjekt = express();
expressObjekt.use( express.static( "public_html" ) );
routenRegistrieren( expressObjekt );

expressObjekt.set( "views" , "templates/" );
expressNunjucks( expressObjekt, { watch: true, noCache: true }); // bei jedem Request neu laden, damit Änderungen sofort sichtbar sind

expressObjekt.listen( PORTNUMMER,
                      () => { logger.info(`Web-Server auf Port ${PORTNUMMER} gestartet.\n`); }
                    );
                    