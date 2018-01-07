// --------------------------------------------------------------------------------------------------
// pir.js - PIR (Motion Sensor Detector) Handler
// Infrared PIR module Motion Sensor Detector (SR501 HC-SR501)
// Monitors one PIR, when motion has been detected an trigger event will be created and attached callback will be called.
// 
// 2018-01-07 Vincent van Beek
//-----------------------------------------------------------------------------------------------------
"use strict";

var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO
var config = require('./pirConfig.json');   // The configuration file for this module 
var debounceTimeout = 20000;                // debounce time of input pin (in msec). Default set to 2000 msec (=2 sec)

exports.version = '0.0.3';

class PIR {

    constructor(gpio, callback, options) {
        if (!(this instanceof PIR)) {
            return new PIR(gpio, options);
        }
        // create (and store) the PIR digital input signal
        this.gpio = gpio;
        this.sensorInput = new Gpio(this.gpio, 'in', 'both'); // input signal when PIR detects motion (rising)
        this.sensorInput.watch(this.trigger.bind(this));                  // when input changes 0=>1 our trigger function will be called
        this.log = options.log.child({ module: 'PIR', gpio: this.gpio }); // use bunyan log (from parent), add two keywords to identify which PIR/GPIO
        this.log.info('creating a PIR Handler for gpio:' + this.gpio);    // debug info (remove later)
        this.callback = callback;                                         // keep reference to callback. will be called when PIR trigger has been detected 
    }

    trigger(err, value) {
        if (err) {
            this.log.error("PIR.trigger error: " + err);
            throw err;
        }

        this.log.info('PIR-GPIO-'+this.gpio+' input signal changed to:' + value);
        console.log('PIR-GPIO-'+this.gpio+' input signal changed to:' + value);

        if (value==1) {
            this.log.info('PIR trigger detected on GPIO:' + this.gpio);
            console.log('PIR trigger detected on GPIO:' + this.gpio);                 
            this.callback(this.gpio);
       
        }
    }

    unexport() {
       this.sensorInput.unexport(); 
    }
    
}
exports.PIR = PIR;
