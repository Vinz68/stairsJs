/* --------------------------------------------------------------------------------------------------
   stairsJs - nodeJS program for RPI-3 to automatically drive stairs LED lights (14 steps), using IR detection.
   - using bunyan as logging framework
   - using onoff as GPIO package
   2018-01-05 Vincent van Beek
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


/* -----------------------------------------------------
    Start of main program
------------------------------------------------------- */

var log = bunyan.createLogger({             // Create a logger, to log application errors (and debug info)
    name: APPNAME,                          // use the application name
    src: true,                              // show source filename, function and line number
                                            // Note: set to false in the production environment since it is time consuming
    streams: [{
        type: "rotating-file",              // Log files will "roll" over (automatic deletion after configured period)
        path: "./logs/"+APPNAME+".log",     // Path and filename of the log file
        period: "1d",                       // daily rotation
        count: 30                           // keep 30 file copies (~1 month)
    }],
    serializers: {                          // usage of default serializers:
        req: bunyan.stdSerializers.req,     // Bunyan's HTTP server request serializer with a suggested set of keys.
        res: bunyan.stdSerializers.res      // Bunyan's HTTP server response serializer with a suggested set of keys.
    }
});

log.info("Starting... " );

var startTime = moment(new Date());
var endTime = moment(new Date());
var LED = new Gpio(17, 'out'); 		        // Use GPIO.0 (pin 11) and specify that it is output


//------------------------------------------------------------------------------------------------------
// Monitors one PIR, when motion has been detected the event handler will be called.
var PIR = require('./modules/pir/pir.js').PIR;


var PIR_UpStairs   = new PIR(20, {log: log}); 		        // Use GPIO.28 (pin 38) as input (from PIR sensor output)
var PIR_DownStairs = new PIR(21, {log: log}); 		        // Use GPIO.29 (pin 40) as input (from PIR sensor output)

PIR_UpStairs.init();
PIR_DownStairs.init();


var blinkInterval = setInterval(blinkLED, 250); // Run the blinkLED function every 250ms

function blinkLED() { 			        // Function to start blinking
    if (LED.readSync() === 0) {		    // Check the pin state, if the state is 0 (or off)
        log.info("Blink ON");
        console.log("Blink ON");
        LED.writeSync(1); 		        // Set pin state to 1 (turn LED on)
    } else {
        log.info("Blink OFF");
        console.log("Blink OFF");
        LED.writeSync(0); 		        // Set pin state to 0 (turn LED off)
    }
}

function endBlink() { 			        // Function to stop blinking
    clearInterval(blinkInterval); 	    // Stop blink intervals
    LED.writeSync(0); 			        // Turn LED off

    log.info("endBlink");
    console.log("endBlink");
}

setTimeout(endBlink,5000); 		        // Stop blinking after 5 seconds

setTimeout(endProgram, 72 * 60 *60000); // End program after 72 hours

/*
BTN.watch(function (err, value) {
    if (err) {
        console.log("BTN.watch error: " + err);
        throw err;
    }
    endTime = moment(new Date());

    log.info("BTN changed to value= " + value + " on: " + endTime.toString());
    console.log("BTN changed to value= " + value + " on: " + endTime.toString());

    var msecDiff = endTime.diff(startTime);
    console.log("Duration in sec.=" + moment.duration(msecDiff).asSeconds() );
    startTime = moment(new Date());

    if (value==1)
        console.log("Trigger 1");

    LED.writeSync(value);
});
*/


// Unexport GPIO to free resources
function unExportGpio() {
    console.log("unExportGpio");
    LED.unexport();
    BTN.unexport();
}

function endProgram() {
    log.info(APPNAME+" has ended.");
    console.log(APPNAME+" has ended.");
    unExportGpio();
}


process.on('SIGINT', function () {
    unExportGpio();
    console.log(APPNAME+" has been terminated.");
    process.exit(10);     // end program with code 10  (forced exit)
});


