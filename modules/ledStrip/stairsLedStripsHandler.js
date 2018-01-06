// --------------------------------------------------------------------------------------------------
// stairsLedStripsHandler.js - Takes care of turning on and off of the configured LedStrips
// It takes care of activating the configured stair-steps (led strips) in a certain sequence.
// The sequence depends on the activation function:
//      on           - turn all led strips on
//      off          - turn all led strips off
//      onUpStairs   - turn stairs led strips on, starting at bottom (first) to top (last)
//      onDownStairs - turn stairs led strips on, starting at top (last) to bottom (firstlast)
//
// 2018-01-06 Vincent van Beek
//-----------------------------------------------------------------------------------------------------
"use strict";

var self;                                   // my own contect, used to acces the log module and other internals

var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO

var deadzone = 20000;                       // time (in msec), default 2000 (2 sec)

exports.version = '0.0.1';

/* TODO: make gpioArray
   var ledStripArray[]; 

   this.gpioArray = gpioArray;
   
   for(var i = 0; i < this.gpioArray.length; i++){

    ledStripArray[i] = new Gpio(this.gpioArray[i], 'out', );         // output signal, to enable one led-strip      
   }

*/

function LedStrip(gpio , options) {
    
    if (!(this instanceof LedStrip)) {
        return new LedStrip(gpio, options);
    }

    // keep our own reference (use in other (Callback) methods. 
    self = this;                        

    // create (and store) the PIR digital input signal
    this.gpio = gpio;
    this.ledStripStair = new Gpio(this.gpio, 'out', );         // output signal, to enable one led-strip

   
    this.log = options.log.child({LedStrip: 'PIR', gpio: this.gpio});  // use bunyan log (from parent), add two keywords to identify which PIR/GPIO
    this.log.info('creating a LedStrip Handler for gpio:'+ this.gpio);    // debug info (remove later)

}
exports.LedStrip =LedStrip;


LedStrip.prototype.on  = function () {

    self.log.info('Turn LedStrip on with GPIO:' + self.gpio);

    self.ledStripStair.writeSync(1); 		        // Set pin state to 1 (turn LedStrip on)
};

LedStrip.prototype.onUpStairs  = function () {

    self.log.info('Turn LedStrip on with GPIO:' + self.gpio);

    self.ledStripStair.writeSync(1); 		        // Set pin state to 1 (turn LedStrip on)
};

LedStrip.prototype.onDownStairs  = function () {

    self.log.info('Turn LedStrip on with GPIO:' + self.gpio);

    self.ledStripStair.writeSync(1); 		        // Set pin state to 1 (turn LedStrip on)
};

LedStrip.prototype.Off  = function () {

    self.log.info('Turn LedStrip on with GPIO:' + self.gpio);

    self.ledStripStair.writeSync(0); 		        // Set pin state to 1 (turn LedStrip on)
};


LedStrip.prototype.offUpStairs  = function () {

    self.log.info('Turn LedStrip on with GPIO:' + self.gpio);

    self.ledStripStair.writeSync(0); 		        // Set pin state to 1 (turn LedStrip on)
};

LedStrip.prototype.offDownStairs  = function () {

    self.log.info('Turn LedStrip on with GPIO:' + self.gpio);

    self.ledStripStair.writeSync(0); 		        // Set pin state to 1 (turn LedStrip on)
};







