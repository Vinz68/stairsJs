/* --------------------------------------------------------------------------------------------------
   stairsJs - nodeJS program for RPI-3 to automatically drive stairs LED lights (14 steps), using IR detection.
   - using bunyan as logging framework
   - using onoff as GPIO package
   2018-01-07 Vincent van Beek
----------------------------------------------------------------------------------------------------- */
"use strict";
var express = require("express");           // Express web application framework. http://expressjs.com/
var bodyParser = require("body-parser");    // Parse incoming request bodies in a middleware before your handlers,
                                            // available under the req.body property. See https://github.com/expressjs/body-parser
var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO
var moment = require('moment');             // Moment is used to determine duration(s)

var APPNAME = "stairsJs";                   // Name of this app used here and there
var PORT = process.env.PORT || 8088;        // Node will listen on port from environment setting, or when not set to port number...

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
    var PIR = require('./modules/pir/pir.js').PIR;
    var PIR_UpStairs   = new PIR(21, pirTiggerEvent, {log: log}); 		        // Use GPIO.28 (pin 38) as input (from PIR sensor output)
    var PIR_DownStairs = new PIR(20, pirTiggerEvent, {log: log}); 		        // Use GPIO.29 (pin 40) as input (from PIR sensor output)

    //------------------------------------------------------------------------------------------------------
    // Define the LedStrips configuration of the stairs (start downstairs to upstairs led strips)
    var StairsLedStrips = require('./modules/ledStrip/stairsLedStrips.js').StairsLedStrips;
    var gpioArray = [ 17, 18, 27, 22, 23, 24, 25, 4, 5, 6, 13, 19, 26, 12];
    var LedStrips = new StairsLedStrips(gpioArray,{log: log});

    //---------------------------------------------------
    // Callback, when PIR detects motion
    function pirTiggerEvent(gpio) {
        endTime = moment(new Date());

        console.log("PIR: " + gpio+  " trigger, on: " + endTime.toString());

        var msecDiff = endTime.diff(startTime);
        startTime = moment(new Date());

        // led strips not turning on ?
        if (!LedStrips.activated) {
            if (gpio == PIR_UpStairs.gpio) {
                LedStrips.onDownDirection();
            } else if (gpio == PIR_DownStairs.gpio) {
                LedStrips.onUpDirection();
            }

            if (LedStrips.activated)  // Led Strips just activated ?
            {
                console.log("Activate LedStrips, direction: " + LedStrips.direction);
                log.info("Activate LedStrips, direction: " + LedStrips.direction);
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

