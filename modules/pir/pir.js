// --------------------------------------------------------------------------------------------------
// pir.js - PIR (Motion Sensor Detector) Handler
// Infrared PIR module Motion Sensor Detector (SR501 HC-SR501)
// Monitors one PIR, when motion has been detected an trigger event will be created and attached callback will be called.
// 
// Settings: 
// deadzone     time (in msec), default 2000 (2 sec), within this time new triggers are ignored (no calls to event handler)
//
// 2018-01-06 Vincent van Beek
//-----------------------------------------------------------------------------------------------------
"use strict";

var self;                                   // my own contect, used to acces the log module and other internals

var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO
var config = require('./pirConfig.json');   // The configuration file for this module 

var deadzone = 20000;                       // time (in msec), default 2000 (2 sec)
var timerId = 0;                            // delay timer id

exports.version = '0.0.2';

function PIR(gpio, options) {
    
    if (!(this instanceof PIR)) {
        return new PIR(gpio, options);
    }

    // keep our own reference (use in other (Callback) methods. 
    self = this;                        

    // create (and store) the PIR digital input signal
    this.gpio = gpio;
    this.sensorInput = new Gpio(this.gpio, 'in', 'rising');         // input signal when PIR detects motion
    this.sensorInput.watch(this.trigger);                           // when input changes 0=>1 our trigger function will be called

   
    this.log = options.log.child({module: 'PIR', gpio: this.gpio});  // use bunyan log (from parent), add two keywords to identify which PIR/GPIO
    this.log.info('creating a PIR Handler for gpio:'+ this.gpio);    // debug info (remove later)
}
exports.PIR = PIR;


PIR.prototype.init = function () {
    this.log.info('init: Starting for ' + this.gpio);


};


PIR.prototype.getPath = function () {
    return config.slidesDirectory;
};


PIR.prototype.trigger = function (err, value) {

    if (err) {
        console.log("PIR.watch error: " + err);
        self.log.error("PIR.watch error: " + err);
        throw err;
    }

    self.log.info('PIR input changed to: ' + value );
    console.log("PIR input changed to: " + value );

    if (value==1)
        console.log("Trigger 1");
};






