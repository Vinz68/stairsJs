// --------------------------------------------------------------------------------------------------
// stairsLedStrips.js - Takes care of turning on and off of the configured LedStrips
// It takes care of activating the configured stair-steps (led strips) in a certain sequence.
// The sequence depends on the activation function:
//      turnOn          - turn all led strips on and after configured time turn them all off
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
exports.version = '0.0.5';


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

        this.activated = false;    // busy turning on or off
        this.direction = 'none'    // direction turning on of off

        this.keepOnDelay = 10000;  // delay keep all stairs on (in msec)
        this.delay = 200;          // delay in msec between ledstrips on/off
        this.onOffTimer = 0;
        this.ledStripArrayIndex = 0;
         
        this.turnOff();  // start with turned off LedStrips
    }

    switchLedStrip(index, value) {
        if (index<this.ledStripArray.length) {
            //console.log('Turn LedStrip['+index+'] to value='+value+' (GPIO-' + this.ledStripArray[index].gpio +')');
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


