﻿// --------------------------------------------------------------------------------------------------
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

exports.version = '0.0.3';


class StairsLedStrips {

    constructor(gpioArray, options) {
        var ledStripArray = [];
        this.ledStripArray = ledStripArray;
        
        if (!(this instanceof StairsLedStrips)) {
            return new StairsLedStrips(gpio, options);
        }

        this.log = options.log.child({StairsLedStrips: 'LedStrip'});  // use bunyan log (from parent), add keyword LedStrip
   
        for(var i = 0; i < gpioArray.length; i++){
            console.log('creating a LedStrip Handler for gpio:'+ gpioArray[i]);    // debug info (remove later)
            ledStripArray[i] = new Gpio(gpioArray[i], 'out', );         // output signal, to enable one led-strip      
        }

        this.activated = false;    // busy turning on or off
        this.direction = 'none'    // direction turning on of off

        this.keepOnDelay = 10000;  // delay keep all stairs on (in msec)
        this.delay = 200;          // delay in msec between ledstrips on/off
        this.onOffTimer = 0;
        this.ledStripArrayIndex = 0;
    }

    switchLedStrip(index, value) {
        if (index<this.ledStripArray.length) {
            if (value) {
                console.log('Turn LedStrip['+index+'] ON (with GPIO:' + this.ledStripArray[index].gpio +')');
            }
            else {
                console.log('Turn LedStrip['+index+'] OFF (with GPIO:' + this.ledStripArray[index].gpio +')');
            }
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
                setTimeout(this.offUpDirection.bind(this), this.keepOnDelay );
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
                setTimeout(this.offDownDirection.bind(this), this.keepOnDelay );
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
            console.log("StairsLedStrips::turnOn");
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
            console.log("StairsLedStrips::onUpDirection");

            this.activated = true; 
            this.direction = 'upstairs';
            this.ledStripArrayIndex = 0;    
                    
            this.onOffTimer = setInterval(this.sequenceLedStripOn.bind(this),this.delay );
        }
    }
    

    onDownDirection() {
        if (!this.activated) {
            console.log("StairsLedStrips::onDownDirection");

            this.activated = true; 
            this.direction = 'downstairs';
            this.ledStripArrayIndex = this.ledStripArray.length;    
                    
            this.onOffTimer = setInterval(this.sequenceLedStripOn.bind(this),this.delay );
        }
    }
    
    turnOff() {
        this.activated = true; 
        this.direction = 'none';

        for(var i = 0; i < this.ledStripArray.length; i++){
            this.switchLedStrip( i, 0);
        }
        this.activated = false;
    }
    
    
    offUpDirection() {
        if (this.activated) {
            console.log("StairsLedStrips::offUpDirection");

            this.direction = 'upstairs';
            this.ledStripArrayIndex = 0;    
                    
            this.onOffTimer = setInterval(this.sequenceLedStripOff.bind(this),this.delay );
        }
    }
    
    offDownDirection() {
        if (this.activated) {
            console.log("StairsLedStrips::offDownDirection");

            this.direction = 'upstairs';
            this.ledStripArrayIndex = this.ledStripArray.length;    
                    
            this.onOffTimer = setInterval(this.sequenceLedStripOff.bind(this),this.delay );
        }      
    };  
    
    unexport() {
        this.ledStripStair[i].unexport(); 

        for(var i = 0; i < this.gpioArray.length; i++){
            console.log("StairsLedStrips::unexport GPIO:"+this.ledStripArray[i].gpio);
            this.ledStripArray[i].unexport(); 
        }
     }
}

exports.StairsLedStrips = StairsLedStrips;









