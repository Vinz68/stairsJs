// --------------------------------------------------------------------------------------------------
// stairsLedStrips.js - Takes care of turning on and off of the configured LedStrips
// It takes care of activating the configured stair-steps (led strips) in a certain sequence.
// The sequence depends on the activation function:
//      turnOn          - turn all led strips on
//      turnOff         - turn all led strips off
//      onDownDirection - turn stairs led strips on, starting at top (last ledstrip) to bottom (first ledstrip)
//      onUpDirection   - turn stairs led strips on, starting at bottom (first ledstrip) to top (last ledstrip)
//      offDownDirection - turn stairs led strips off, starting at top (last ledstrip) to bottom (first ledstrip)
//      offUpDirection   - turn stairs led strips off, starting at bottom (first ledstrip) to top (last ledstrip)
//
// 2018-01-07 Vincent van Beek
//-----------------------------------------------------------------------------------------------------
"use strict";

var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO

exports.version = '0.0.2';

/* TODO: make gpioArray
   var ledStripArray[]; 

   this.gpioArray = gpioArray;
   
   for(var i = 0; i < this.gpioArray.length; i++){

    ledStripArray[i] = new Gpio(this.gpioArray[i], 'out', );         // output signal, to enable one led-strip      
   }

*/


class StairsLedStrips {

    constructor(gpio, options) {
        
        if (!(this instanceof StairsLedStrips)) {
            return new StairsLedStrips(gpio, options);
        }

        // create (and store) the PIR digital input signal
        this.gpio = gpio;
        this.ledStripStair = new Gpio(this.gpio, 'out', );         // output signal, to enable one led-strip
    
        this.log = options.log.child({LedStrip: 'PIR', gpio: this.gpio});  // use bunyan log (from parent), add two keywords to identify which PIR/GPIO
        this.log.info('creating a LedStrip Handler for gpio:'+ this.gpio);    // debug info (remove later)

        this.activated = false; 
        this.direction = 'none'
    }

    turnOn() {

        this.log.info('Turn LedStrip ON (with GPIO:' + this.gpio +')');
    
        this.ledStripStair.writeSync(1); 		        // Set pin state to 1 (turn LedStrip on)
    }
    
    onUpDirection() {

        this.activated = true; 
        this.direction = 'upstairs'        
    
        this.log.info('Turn LedStrip on with GPIO:' + this.gpio);
    
        this.ledStripStair.writeSync(1); 		        // Set pin state to 1 (turn LedStrip on)
    }
    
    onDownDirection() {

        this.activated = true; 
        this.direction = 'downstairs'
    
        this.log.info('Turn LedStrip on with GPIO:' + this.gpio);
    
        this.ledStripStair.writeSync(1); 		        // Set pin state to 1 (turn LedStrip on)
    }
    
    turnOff() {
        this.activated = false; 
        this.direction = 'none'        
    
        this.log.info('Turn LedStrip on with GPIO:' + this.gpio);
    
        this.ledStripStair.writeSync(0); 		        // Set pin state to 1 (turn LedStrip on)
    }
    
    
    offUpDirection() {
    
        this.log.info('Turn LedStrip on with GPIO:' + this.gpio);
    
        this.ledStripStair.writeSync(0); 		        // Set pin state to 1 (turn LedStrip on)
    }
    
    offDownDirection() {
    
        this.log.info('Turn LedStrip on with GPIO:' + this.gpio);
    
        this.ledStripStair.writeSync(0); 		        // Set pin state to 1 (turn LedStrip on)
    };  
    
    unexport() {
        this.ledStripStair.unexport(); 
     }
}

exports.StairsLedStrips = StairsLedStrips;










