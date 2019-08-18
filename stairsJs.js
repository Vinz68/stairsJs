/* --------------------------------------------------------------------------------------------------
   stairsJs - nodeJS program for RPI-3 to automatically drive stairs LED lights (14 steps), using IR detection.
   - using bunyan as logging framework
   - using onoff as GPIO package
   2018-01-22   Initial version                                           Vincent van Beek
   2018-12-28   WebGUI - StairsJS Control Panbel - added.                 Vincent van Beek
                GUI created with ReactJS,
                it's also on github: https://github.com/Vinz68/stairsJs-cp
   2019-05-10   Mode 33 added (On when dark, Automatic by PIR after 23:00). which means:
                - turn on when it get dark (and keep on until 23:00)
                - after 23:00 and sunrise, turn on when PIR detects motion.
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

var sunCalc = require('suncalc');           // SunCalc is used to used sunrise / sunset time. https://github.com/mourner/suncalc
var config = require('./config.json');      // The application configuration

const APPNAME = "stairsJs";                 // Name of this app used here and there
var PORT = process.env.PORT || 9000;        // Node will listen on port from environment setting, or when not set to port number...

var bunyan = require("bunyan");             // Bunyan is a simple and fast JSON logging library. https://github.com/trentm/node-bunyan
var log = bunyan.createLogger({             // Create a logger, to log application errors (and debug info)
    name: APPNAME,                          // use the application name
    src: false,                             // show source filename, function and line number
                                            // Note: set to false in the production environment since it is time consuming
    streams: [
        {
            level: 'info',                  // log level INFO and above to rotating file
            type: "rotating-file",          // Log files will "roll" over (automatic deletion after configured period)
            path: "./logs/" + APPNAME + ".log", // Path and filename of the log file
            period: "1d",                   // daily rotation
            count: 30                       // keep 30 file copies (~1 month)
        }
    ],
    serializers: {                          // usage of default serializers:
        req: bunyan.stdSerializers.req,     // Bunyan's HTTP server request serializer with a suggested set of keys.
        res: bunyan.stdSerializers.res      // Bunyan's HTTP server response serializer with a suggested set of keys.
    }
});


const currentStateOptions = [               // all possible program states
            { value:  '1', label: 'Always off.'},

            { value: '11', label: 'Automatic, by PIR.'},
            { value: '12', label: 'Automatic, by PIR when dark.'},

            { value: '31', label: 'Always on.'},
            { value: '32', label: 'Always on when dark.'},
            { value: '33', label: 'On when dark, Automatic by PIR after 23:00'},

            { value: '91', label: 'Test1 activated.'}
];

var currentState = 0;                   // current program state
var prevState = currentState;           // previous program state
var checkAutomaticOnOffTimer = 0;       // interval timer, to check if stairs should be tuned on or off (in mode 32) 


/* -----------------------------------------------------
    Start of main program
------------------------------------------------------- */
// using 'Immediately-Invoked Function Expression (IIFE)' pattern
(function () {
    log.info("-----------------------------------------------");
    log.info("Started on: " + Date());
    log.info("-----------------------------------------------");

    // Set default program mode (currentState) to the configured value.
    setCurrentState(config.startupState,false);
    prevState = currentState;

    // Used to determine duration
    var startTime = moment(new Date());
    var endTime = moment(new Date());

    var intervalDelay = config.checkAutomaticOnInterval; // interval delay, to check if stairs should be tuned on or off (in mode 32)
    checkAutomaticOnOffTimer = setInterval( checkAutomaticOnOff, intervalDelay );


    //------------------------------------------------------------------------------------------------------
    // Monitors two PIRs, when motion has been detected the event handler will be called.
    log.info("Setup PIRs.");
    var PIR = require('./modules/pir/pir.js').PIR;
    var PIR_UpStairs = new PIR(20, pirTiggerEvent, { log: log }); 		        // Use GPIO.28 (pin 38) as input (from PIR sensor output)
    var PIR_DownStairs = new PIR(21, pirTiggerEvent, { log: log }); 		        // Use GPIO.29 (pin 40) as input (from PIR sensor output)

    //------------------------------------------------------------------------------------------------------
    // Define the LedStrips configuration of the stairs (start downstairs to upstairs led strips)
    log.info("Setup Ledstrips");
    var StairsLedStrips = require('./modules/ledStrip/stairsLedStrips.js').StairsLedStrips;
    var gpioArray = [17, 18, 27, 22, 23, 24, 25, 4, 5, 6, 13, 19, 26, 12];
    var LedStrips = new StairsLedStrips(gpioArray, { log: log });

    //------------------------------------------------------------------------------------------------------
    // Some setup for the REST API, to support GET and POST in an easy way.
    log.info("Setup webserver for 'StairsJs Control Panel' ");

    app.use(bodyParser.text({ type: '*/*' }));
    app.use( bodyParser.json() );       // to support JSON-encoded bodies

    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
      }));

    // CORS: Allow cross-domain requests (blocked by default)
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // Serve the 'StairsJS Control Panel' page
    // (located in the 'build' folder, using 'npm run build' of the React Application)
    app.use(express.static(path.join(__dirname, 'build')));

    app.get('/', function (req, res) {
        console.log('GET / received, routing to /build/index.html...');
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });

    // GET on /suncalc    => Send the sunrise and sunset times
    app.get('/suncalc', function (req, res, next) {
        console.log('GET /suncalc received....processing...');

        var myResult = { "sunset": "", "sunrise": "" };

        // get today's sunlight times for my location
        // use 'https://www.gps-coordinates.net/' to find your
        // location latitude and longitude (and configure them in config.json)
        var sunCalcObject = sunCalc.getTimes(new Date(), config.latitude, config.longitude);

        myResult.sunrise = checkTime(sunCalcObject.sunrise.getHours()) + ':' +
            checkTime(sunCalcObject.sunrise.getMinutes()) + ':' +
            checkTime(sunCalcObject.sunrise.getSeconds());

        myResult.sunset = checkTime(sunCalcObject.sunset.getHours()) + ':' +
            checkTime(sunCalcObject.sunset.getMinutes()) + ':' +
            checkTime(sunCalcObject.sunset.getSeconds());

        res.contentType('application/json');
        res.send(JSON.stringify(myResult));
    });


    // GET on /status    => Send the status of this program
    app.get('/status', function (req, res, next) {
        log.info('GET /status received....processing...');
        console.log('GET /status received....processing...');

        var myResult = { currentState: 0, currentStateText: 'offline', disableDuringDaylight: false, currentStateOptions: [] };

        myResult.currentState = currentState;

        for (var i = 0; i < currentStateOptions.length; i++) {
            if (currentStateOptions[i].value == currentState)
                myResult.currentStateText = currentStateOptions[i].label;
        }

        myResult.disableDuringDaylight = config.disableDuringDaylight;
        myResult.currentStateOptions = currentStateOptions;

        console.log("Return currentState = "+ myResult.currentState );
        console.log("Return currentStateText = "+ myResult.currentStateText );

        res.contentType('application/json');
        res.send(JSON.stringify(myResult));
    });


    // The POST on /control => set the mode (=currentState) of this program
    app.post('/control',function(req, res){
        log.info('POST /control received....processing...');
        console.log('POST /control received....processing...');
        console.log(req.headers['content-type']);       // show received headers in the console

        if (!req.body) {                                // we need an XML or JSON body
            res.status(400);
            res.send('XML or JSON Body is required');
            console.log("XML or JSON Body is required");
        }
        else {

            // show received request body in the console
            console.log(req.body);
            var dataObject = JSON.parse(req.body);

            // Process the requested program mode (new currentState)
            if (dataObject.requestedState) {
                var newState = dataObject.requestedState;
                setCurrentState(newState,false)

                console.log("OK, processed");
                res.status(201);                            // 201 = status created since new content has been created (received)
                res.send("OK, processed");                  // and in the body we return a status text
            }
            else {
                console.log("Not OK, not processed");
                res.status(400);                            // 400, Bad request, since we could process the post request
                res.send("Not OK, not processed");          // and in the body we return a status text
            }
        }
      });

    var server = app.listen(PORT, function () {
        // Log that we have started and accept incomming connections on the configured port
        log.info(APPNAME + ": Control Panel is ready and listening on port: " + PORT);
        console.log(APPNAME + ": Control Panel is ready and listening on port: " + PORT);
    });

    log.info("Setup webserver completed.' ");
    console.log("Setup completed, program is running...");

    //------------------------------------------------------------------------------------------------------

    function checkTime(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    //---------------------------------------------------
    // Callback, when PIR detects motion

    function pirTiggerEvent(gpio) {
        var now = moment();

        // Depending on program-mode (currentState), do not light stairs during daylight
        if ( (currentState == 12) || (currentState == 33) ) {

            // get today's sunlight times for my location
            // use 'https://www.gps-coordinates.net/' to find your
            // location latitude and longitude (and configure them in config.json)
            var times = sunCalc.getTimes(now, config.latitude, config.longitude);

            if ((now < times.sunriseEnd) || (now > times.sunsetStart)) {
                console.log("pirTriggerEvent: its dark enough to enable stairs LedStrips");
            }
            else {
                // Its currently between sunrise and sunset and we should have enough daylight.
                // Stop processing ; disable stairs LedStrips.
                console.log("pirTriggerEvent: its NOT dark enough to enable stairs LedStrips");
                return;
            }
        }

        if ( (currentState == 11) || (currentState == 12) || (currentState == 33) ) {
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
        }
    };


    function setCurrentState(state,dontRememberPrev) {

        if (state!=currentState) {
            var msg = "Program state changed from: " + currentState + " to: " + state;
            log.info(msg);
            console.log(msg);

            currentState = state;                   // current program state

            if (!dontRememberPrev) {
                prevState = currentState;           // previous program state
            }

            if (currentState == 1) {
                console.log("Turn LedStrips Off Now");
                LedStrips.turnOffNow()
            }
            else if (currentState == 31) {
                console.log("Turn LedStrips ON");
                LedStrips.keepOn();
            }
            else if (currentState == 32) {
                console.log("Turn LedStrips ON - as soon its dark");
            }

            console.log("CurrentState is set to:" +currentState);
        }
    }

    // Unexport GPIO to free resources
    function unExportGpio() {
        log.info("unExportGpio");
        PIR_UpStairs.unexport();
        PIR_UpStairs.unexport();
        LedStrips.unexport();
    }

    // Handle CTRL-C and termination.
    process.on('SIGINT', function () {
        // stop inteval
        clearInterval(checkAutomaticOnOffTimer);

        unExportGpio();

        log.info(APPNAME + " has been terminated.");
        process.exit(1);     // end program with code 1 (forced exit)
    });


    //---------------------------------------------------
    // Callback, by timeInterval
    function checkAutomaticOnOff() {

        var now = moment();
        var turnOffTime = now;

        // Depending on program-mode (currentState), turn stairs automatic on or off
        // On : when it gets dark
        // Off: when it gets daylight
        if ( (currentState == 32) || (currentState == 33) ) {

            // get today's sunlight times for my location
            // use 'https://www.gps-coordinates.net/' to find your
            // location latitude and longitude (and configure them in config.json)
            var times = sunCalc.getTimes(now, config.latitude, config.longitude);

            // after 23:00 , use PIR to enable the lights.
            if (currentState == 33) {
                turnOffTime = moment(times.sunriseStart);
                turnOffTime.subtract({ days: 1 });
                turnOffTime.hour(23);
                turnOffTime.minute(0);
                console.log("turnOffTime = " + turnOffTime.local().format() );
            }

            if ((now < turnOffTime) || (now > times.sunsetStart)) {
                // its dark enough to enable stairs LedStrips

                 // Led strips not turned on ?
                if (!LedStrips.ledsOn) {
                    console.log("checkAutomaticOnOff: its dark enough to enable stairs LedStrips - keepOn");
                    LedStrips.keepOn();
                }
            }
            else {
                // Its currently between sunrise and sunset and we should have enough daylight.
                // its NOT dark enough to enable stairs LedStrips");
                // Led strips turned on ?
                if (LedStrips.ledsOn) {
                    if (currentState == 33) {
                        console.log("checkAutomaticOnOff: its not dark enough or later then 23:00 - turnOffNow");
                    }
                    else {
                        console.log("checkAutomaticOnOff: its NOT dark enough to enable stairs LedStrips - turnOffNow");
                    }
                    LedStrips.turnOffNow();
                }
            }
        }
    };

})();

