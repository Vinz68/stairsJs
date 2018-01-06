// --------------------------------------------------------------------------------------------------
// pirMotionHandler - PIR (Motion Sensor Detector) Handler
// 
// Infrared PIR module Motion Sensor Detector (SR501 HC-SR501) event handler
//
// Monitors one PIR, when motion has been detected the event handler will be called.
// 
// Settings: 
// edge         true (default) means on positive (0=>1) trigger, the event handler will be called
//              flase means on negative (1=>0) tigger, the event handler will be called
// deadzone     time (in msec), default 2000 (2 sec), within this time new triggers are ignored (no calls to event handler)
// Add FileEvent (=new file detected)
//
// 2018-01-06 Vincent van Beek
//-----------------------------------------------------------------------------------------------------
"use strict";

var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO
var config = require('./pirMotionConfig.json');   // The configuration file for this module 


var edge = true;                            // tigger on 0=>1
var deadzone = 20000;                       // time (in msec), default 2000 (2 sec)
var timerId = 0;                            // delay timer id

//------------------------------------------------------------------------------------------------------

exports.version = '0.0.1';

function PIR(gpio, options) {
    
    if (!(this instanceof PIR)) {
        return new PIR(gpio, options);
    }

    this.gpio = gpio;
    this.log = options.log.child({widget_type: 'PirMotionHandler'});
    this.log.info('creating a PIR Handler for gpio:'+ this.gpio)
}
exports.PIR = PIR;

PIR.prototype.init = function () {
    this.log.info('init: Starting for ' + this.gpio);
};

PIR.prototype.getPath = function () {
    return config.slidesDirectory;
};






