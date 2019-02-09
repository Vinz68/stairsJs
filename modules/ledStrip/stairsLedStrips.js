// --------------------------------------------------------------------------------------------------
// stairsLedStrips.js - Takes care of turning on and off of the configured LedStrips
// It takes care of activating the configured stair-steps (led strips) in a certain sequence.
// The sequence depends on the activation function:
//      turnOn           - turn all led strips on and after configured time turn them all off
//      keepOn           - turn all led strips on, and keep them on
//      turnOff          - turn all led strips off, depending on setting of direction with or without delay
//      turnOffNow       - turn all led strips off, direct without delay.
//      onDownDirection  - turn stairs led strips on, starting at top (last ledstrip) to bottom (first ledstrip)
//      onUpDirection    - turn stairs led strips on, starting at bottom (first ledstrip) to top (last ledstrip)
//      offDownDirection - turn stairs led strips off, starting at top (last ledstrip) to bottom (first ledstrip)
//      offUpDirection   - turn stairs led strips off, starting at bottom (first ledstrip) to top (last ledstrip)
//
// 2018-01-07 Vincent van Beek  v0.0.5  => tested version
// 2018-03-13 Vincent van Beek  v0.0.6  => Update: config file added for 2 settings (keepOnDelay and delayBetweenStairs)
// 2019-01-05 Vincent van Beek  v0.1.0  => added turnOffNow (turns of all ledlights, in a fast way)
// 2019-01-08 Vincent van Beek  v0.1.1  => added keepOn (turns on all ledlights, in a fast way, and keeps them on)
//-----------------------------------------------------------------------------------------------------
"use strict";
exports.version = '0.1.1';

var Gpio = require('onoff').Gpio;           // Include onoff to interact with the GPIO
var config = require('./config.json');      // The configuration 
                                            //    config.keepOnDelay        = time in msec the stairs stays "on" (lights on time)
                                            //    config.delayBetweenStairs = time in msec between each stair to turn on (after each other)

class StairsLedStrips {

    constructor(gpioArray, options) {
        var ledStripArray = [];
        this.ledStripArray = ledStripArray;

        if (!(this instanceof StairsLedStrips)) {
            return new StairsLedStrips(gpio, options);
        }

        this.log = options.log.child({StairsLedStrips: 'LedStrip'});  // use bunyan log (from parent), add keyword LedStrip

        for(var i = 0; i < gpioArray.length; i++){
            this.log.info('creating a LedStrip Handler for gpio:'+ gpioArray[i]);
            ledStripArray[i] = new Gpio(gpioArray[i], 'out', 'none', {activeLow: true} );         // output signal, to enable one led-strip, not used relais is active-low
        }

        this.ledsOn = false;        // fag if leds are all on (or not)
        this.activated = false;     // busy turning on or off
        this.direction = 'none'     // direction turning on of off

        this.keepOnDelay = config.keepOnDelay;  // delay keep all stairs on (in msec)
        this.delay = config.delayBetweenStairs; // delay in msec between ledstrips on/off
        this.onOffTimer = 0;
        this.ledStripArrayIndex = 0;
         
        this.turnOff();  // start with turned off LedStrips
    }

    switchLedStrip(index, value) {
        if (index<this.ledStripArray.length) {
            this.ledStripArray[index].writeSync(value); 		     // Set pin state to 0 or 1 (turn LedStrip off or on)
        }
    }

    sequenceLedStripOn() {
        if (this.direction =='upstairs') {
            if (this.ledStripArrayIndex<this.ledStripArray.length) {
                this.switchLedStrip(this.ledStripArrayIndex, 1);
                this.ledStripArrayIndex++;
                return;
            } else {
                // turn stairs ledstips off after some time
                clearInterval(this.onOffTimer);
                setTimeout(this.turnOff.bind(this), this.keepOnDelay );
                this.ledsOn = true;                
            }
        }
        else if (this.direction =='downstairs') {
            if (this.ledStripArrayIndex>=0) {
                this.switchLedStrip(this.ledStripArrayIndex, 1);
                this.ledStripArrayIndex--;
                return;
            } else {
                // turn stairs ledstips off after some time
                clearInterval(this.onOffTimer);
                setTimeout(this.turnOff.bind(this), this.keepOnDelay );
                this.ledsOn = true;                
            }
        }
    }

    sequenceLedStripOff() {
        if (this.direction =='upstairs') {
            if (this.ledStripArrayIndex<this.ledStripArray.length) {
                this.switchLedStrip(this.ledStripArrayIndex, 0);
                this.ledStripArrayIndex++;
                return;
            } 
        }
        else if (this.direction =='downstairs') {
            if (this.ledStripArrayIndex>=0) {
                this.switchLedStrip(this.ledStripArrayIndex, 0);
                this.ledStripArrayIndex--;
                return;
            } 
        }
        // turn stairs ledstips off after some time
        clearInterval(this.onOffTimer);
        this.activated = false;
        this.ledsOn = false;
    }

    turnOn() {
        if (!this.activated) {
            this.log.info("StairsLedStrips::turnOn");
            this.activated = true; 
            this.direction = 'none';

            for(var i = 0; i < this.ledStripArray.length; i++){
                this.switchLedStrip( i, 1);
            }

            setTimeout(this.turnOff.bind(this), this.keepOnDelay );
        }
    }

    keepOn() {
        // force of stopping current activities
        clearInterval(this.onOffTimer);

        // flag, indicating busy..   
        this.activated = true;
        this.log.info("StairsLedStrips::keepOn");
        
        // NOTE: do NOT activate / keep deactivated to allow other actions
        this.direction = 'none';

        for(var i = 0; i < this.ledStripArray.length; i++){
            this.switchLedStrip( i, 1);
        }

        this.ledsOn = true;
        this.activated = false;
    }


    onUpDirection() {
        if (!this.activated) {
            this.log.info("StairsLedStrips::onUpDirection");

            this.activated = true;
            this.direction = 'upstairs';
            this.ledStripArrayIndex = 0;
            this.onOffTimer = setInterval(this.sequenceLedStripOn.bind(this),this.delay );
        }
    }

   onUpDirectionSlow(inMsec) {
        if (!this.activated) {
            this.log.info("StairsLedStrips::onUpDirectionSlow");

            this.activated = true;
            this.direction = 'upstairs';
            this.ledStripArrayIndex = 0;
            this.onOffTimer = setInterval(this.sequenceLedStripOn.bind(this),inMsec );
        }
    }

    onDownDirection() {
        if (!this.activated) {
            this.log.info("StairsLedStrips::onDownDirection");

            this.activated = true;
            this.direction = 'downstairs';
            this.ledStripArrayIndex = this.ledStripArray.length;
            this.onOffTimer = setInterval(this.sequenceLedStripOn.bind(this),this.delay );
        }
    }

    turnOff() {
        this.activated = true;
        this.log.info("StairsLedStrips::turnOff");

        if (this.direction =='upstairs')
        {
            this.offUpDirection();
            return;
        }

        if (this.direction =='downstairs')
        {
            this.offDownDirection();
            return;
        }

        this.direction = 'none';

        for(var i = 0; i < this.ledStripArray.length; i++){
            this.switchLedStrip( i, 0);
        }
        this.activated = false;
        this.ledsOn = false;        
    }

    turnOffNow() {
        this.direction = 'none';
        this.turnOff();
        this.ledsOn = false;
    }

    offUpDirection() {
        if (this.activated) {
            this.log.info("StairsLedStrips::offUpDirection");

            this.direction = 'upstairs';
            this.ledStripArrayIndex = 0;
            this.onOffTimer = setInterval(this.sequenceLedStripOff.bind(this), this.delay );
        }
    }

    offDownDirection() {
        if (this.activated) {
            this.log.info("StairsLedStrips::offDownDirection");

            this.direction = 'downstairs';
            this.ledStripArrayIndex = this.ledStripArray.length;
            this.onOffTimer = setInterval(this.sequenceLedStripOff.bind(this), this.delay );
        }
    }

    unexport() {
        this.ledStripStair[i].unexport();

        for(var i = 0; i < this.gpioArray.length; i++){
            console.log("StairsLedStrips::unexport GPIO:"+this.ledStripArray[i].gpio);
            this.ledStripArray[i].unexport();
        }
     }
}
exports.StairsLedStrips = StairsLedStrips;
