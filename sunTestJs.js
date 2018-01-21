/* --------------------------------------------------------------------------------------------------
   sunTestJs - test program to determine when it is dark enough to allow light (test program for stairsJs)
   - using suncalc to determine sunrise and sunset
   2018-01-21 Vincent van Beek
----------------------------------------------------------------------------------------------------- */
"use strict";
var SunCalc = require('suncalc');	    // SunCals is used to used sunrise / sunset time.



/* -----------------------------------------------------
    Start of main program
------------------------------------------------------- */
// using 'Immediately-Invoked Function Expression (IIFE)' pattern
(function(){ 

        // get today's sunlight times for Amsterdam
        var now = new Date();
        var times = SunCalc.getTimes(now, 51.5, -0.1);

        console.log("stairLight should work today before: " + times.sunriseEnd + " and after " + times.sunsetStart );


        if ( (now < times.sunriseEnd ) || (now > times.sunsetStart)) {
                console.log("stairLight - enable");
        }
        else
        {
                console.log("stairLight - disable");
        }

})();
