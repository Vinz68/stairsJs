/* --------------------------------------------------------------------------------------------------
   stairsJs - nodeJS program for RPI-3 to automatically drive stairs LED lights (14 steps), using IR detection.
   - using bunyan as logging framework
   - using onoff as GPIO package
   2018-01-22   Initial version                                           Vincent van Beek
   2018-12-28   WebGUI - StairsJS Control Panbel - added.                 Vincent van Beek
                GUI created with ReactJS, 
                it's also on github: https://github.com/Vinz68/stairsJs-cp
----------------------------------------------------------------------------------------------------- */
"use strict";
var express = require("express");           // Express web application framework. http://expressjs.com/
const app = express();

var os = require('os');                     // OS specific info
var fs = require('fs');                     // We will use the native file system
const path = require('path');

var bodyParser = require("body-parser");    // Parse incoming request bodies in a middleware before your handlers,
                                            // available under the req.body property. See https://github.com/expressjs/body-parser
var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO
var moment = require('moment');             // Moment is used to determine duration(s)

var sunCalc = require('suncalc');           // SunCalc is used to used sunrise / sunset time. https://github.com/mourner/suncalcs
var config = require('./config.json');      // The configuration for sunCalc

const APPNAME = "stairsJs";                 // Name of this app used here and there
var PORT = process.env.PORT || 9000;        // Node will listen on port from environment setting, or when not set to port number...

var bunyan = require("bunyan");             // Bunyan is a simple and fast JSON logging library. https://github.com/trentm/node-bunyan
var log = bunyan.createLogger({             // Create a logger, to log application errors (and debug info)
    name: APPNAME,                          // use the application name
    src: true,                              // show source filename, function and line number
                                            // Note: set to false in the production environment since it is time consuming
    streams: [
        {
            level: 'info',                  // log level INFO and above to rotating file
            type: "rotating-file",          // Log files will "roll" over (automatic deletion after configured period)
            path: "./logs/"+APPNAME+".log", // Path and filename of the log file
            period: "1d",                   // daily rotation
            count: 30                       // keep 30 file copies (~1 month)
        }
    ],
    serializers: {                          // usage of default serializers:
        req: bunyan.stdSerializers.req,     // Bunyan's HTTP server request serializer with a suggested set of keys.
        res: bunyan.stdSerializers.res      // Bunyan's HTTP server response serializer with a suggested set of keys.
    }
});



/* -----------------------------------------------------
    Start of main program
------------------------------------------------------- */
// using 'Immediately-Invoked Function Expression (IIFE)' pattern
(function(){ 
    log.info("-----------------------------------------------");
    log.info("Started on: " + Date() );
    log.info("-----------------------------------------------");

    // Used to determine duration
    var startTime = moment(new Date());
    var endTime = moment(new Date());

    //------------------------------------------------------------------------------------------------------
    // Monitors two PIRs, when motion has been detected the event handler will be called.
    log.info("Setup PIRs.");
    var PIR = require('./modules/pir/pir.js').PIR;
    var PIR_UpStairs   = new PIR(20, pirTiggerEvent, {log: log}); 		        // Use GPIO.28 (pin 38) as input (from PIR sensor output)
    var PIR_DownStairs = new PIR(21, pirTiggerEvent, {log: log}); 		        // Use GPIO.29 (pin 40) as input (from PIR sensor output)

    //------------------------------------------------------------------------------------------------------
    // Define the LedStrips configuration of the stairs (start downstairs to upstairs led strips)
    log.info("Setup Ledstrips");
    var StairsLedStrips = require('./modules/ledStrip/stairsLedStrips.js').StairsLedStrips;
    var gpioArray = [ 17, 18, 27, 22, 23, 24, 25, 4, 5, 6, 13, 19, 26, 12];
    var LedStrips = new StairsLedStrips(gpioArray,{log: log});

    //------------------------------------------------------------------------------------------------------
    // Serve the 'StairsJS Control Panel' page 
    // (located in the 'build' folder, using 'npm run build' of the React Application)
    log.info("Setup webserver for 'StairsJs Control Panel' ");
    app.use(express.static(path.join(__dirname, 'build')));

    app.get('/', function(req, res) {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });

    //--------------------------------------------------------------------------------------------------------
    // CORS: Allow cross-domain requests (blocked by default)
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });


    //--------------------------------------------------------------------------------------------------------
    // suncalc    => Send the sunrise and sunset times 
    app.get('/suncalc', function (req, res, next) {
        log.info('suncalc requested. returning the json with sunrise and sunset');

        var myResult = { "sunset":"", "sunrise": "" };

        // get today's sunlight times for my location 
        // use 'https://www.gps-coordinates.net/' to find your 
        // location latitude and longitude (and configure them in config.json)
        var sunCalcObject = sunCalc.getTimes(new Date(), config.latitude, config.longitude);

        myResult.sunrise =  checkTime(sunCalcObject.sunrise.getHours()) + ':' + 
                            checkTime(sunCalcObject.sunrise.getMinutes()) + ':' + 
                            checkTime(sunCalcObject.sunrise.getSeconds());

        myResult.sunset =   checkTime(sunCalcObject.sunset.getHours()) + ':' + 
                            checkTime(sunCalcObject.sunset.getMinutes()) + ':' + 
                            checkTime(sunCalcObject.sunset.getSeconds());

        res.contentType('application/json');
        res.send( JSON.stringify(myResult) );
    });

    
    var server = app.listen(PORT, function () {
        // Log that we have started and accept incomming connections on the configured port
        log.info(APPNAME + ": Control Panel is ready and listening on port: " + PORT);
        console.log(APPNAME + ": Control Panel is ready and listening on port: " + PORT);
    });


    function checkTime(i) {
        if (i < 10) {
          i = "0" + i;
        }
        return i;
      }

    //---------------------------------------------------
    // Callback, when PIR detects motion
    function pirTiggerEvent(gpio) {
        var now = new Date();
       
        // When enabled, do not light stairs during daylight
        if (config.disableDuringDaylight) {

            // get today's sunlight times for my location 
            // use 'https://www.gps-coordinates.net/' to find your 
            // location latitude and longitude (and configure them in config.json)
            var times = sunCalc.getTimes(now, config.latitude, config.longitude);

            if ( (now < times.sunriseEnd ) || (now > times.sunsetStart)) {
                    console.log("pirTriggerEvent: its dark enough to enable stairs LedStrips");
            }
            else {
                    // Its currently between sunrise and sunset and we should have enough daylight.
                    // Stop processing ; disable stairs LedStrips.
                    return;
            }
        }


        // Led strips not turning on ?
        if (!LedStrips.activated) {
            if (gpio == PIR_UpStairs.gpio) {
                // PIR-UpStairs detected motion => turn stairs on from bottom to top
                LedStrips.onUpDirection();            
            } else if (gpio == PIR_DownStairs.gpio) {
                // PIR-DownStairs detected motion => turn stairs on from top to bottom
                LedStrips.onDownDirection(); 
            }

            if (LedStrips.activated) {  // Led Strips just activated ?
                log.info("LedStrips activated. Direction: " + LedStrips.direction);
                console.log("LedStrips activated. Direction: " + LedStrips.direction);
            }
        }
    };

    // Unexport GPIO to free resources
    function unExportGpio() {
        log.info("unExportGpio");
        PIR_UpStairs.unexport();
        PIR_UpStairs.unexport();
        LedStrips.unexport();
    }

    // Handle CTRL-C and termination. 
    process.on('SIGINT', function () {
        unExportGpio();
        log.info(APPNAME+" has been terminated.");
        process.exit(1);     // end program with code 1 (forced exit)
    });

})();

