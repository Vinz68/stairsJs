/* --------------------------------------------------------------------------------------------------
   testStripsJs - nodeJS program for RPI-3 to to test stairs LED lights (14 steps), using IR detection.
   - using bunyan as logging framework
   - using onoff as GPIO package
   2018-01-12 Vincent van Beek
----------------------------------------------------------------------------------------------------- */
"use strict";
var express = require("express");           // Express web application framework. http://expressjs.com/
var bodyParser = require("body-parser");    // Parse incoming request bodies in a middleware before your handlers,
                                            // available under the req.body property. See https://github.com/expressjs/body-parser
var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO
var moment = require('moment');             // Moment is used to determine duration(s)

var APPNAME = "testStripsJs";               // Name of this app used here and there
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
    // Define the LedStrips configuration of the stairs (start downstairs to upstairs led strips)
    var StairsLedStrips = require('./modules/ledStrip/stairsLedStrips.js').StairsLedStrips;

    var gpioArray = [ 17, 18, 27, 22, 23, 24, 25, 4, 5, 6, 13, 19, 26, 12];
    var LedStrips = new StairsLedStrips(gpioArray,{log: log});

    //------------------------------------------------------------------------------------------------------
    // Turn LedStrips on , 5 sec after each other 
    LedStrips.onUpDirectionSlow(5000);

    // Unexport GPIO to free resources
    function unExportGpio() {
        log.info("unExportGpio");
        PIR_UpStairs.unexport();
        PIR_UpStairs.unexport();
    }

    function endProgram() {
        log.info(APPNAME+" has ended.");
        console.log(APPNAME+" has ended.");
        unExportGpio();
        process.exit(0);     // end program 0  (clean exit)
    }

    process.on('SIGINT', function () {
        unExportGpio();
        log.info(APPNAME+" has been terminated.");
        process.exit(1);     // end program with code 1 (forced exit)
    });

})(); 


