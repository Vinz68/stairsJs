// --------------------------------------------------------------------------------------------------
// pir.js - PIR (Motion Sensor Detector) Handler
// Infrared PIR module Motion Sensor Detector (SR501 HC-SR501)
// Monitors one PIR, when motion has been detected an trigger event will be created and attached callback will be called.
// 
// 2018-01-07 Vincent van Beek
//-----------------------------------------------------------------------------------------------------
"use strict";

var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO

exports.version = '0.0.5';

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

        if (value==1) {
            this.log.info('PIR trigger detected on GPIO:' + this.gpio);
            //console.log('PIR trigger detected on GPIO:' + this.gpio);                 
            this.callback(this.gpio);
        }
    }

    unexport() {
       this.sensorInput.unexport(); 
    }
    
}
exports.PIR = PIR;
