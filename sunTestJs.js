


        // get today's sunlight times for Amsterdam
        var times = SunCalc.getTimes(new Date(), 51.5, -0.1);

        // format sunriseEnd time (bottom edge of the sun touches the horizon) from the Date object
        var sunriseEndStr = times.sunriseEnd.getHours() + ':' + times.sunriseEnd.getMinutes();

        // format sunsetStart time (bottom edge of the sun touches the horizon) from the Date object
        var sunsetStartStr = times.sunsetStart.getHours() + ':' + times.sunsetStart.getMinutes();

       console.log("stairLight should work before: " + sunriseEndStr + " and after: " + sunsetStartStr );

       console.log("stairLight should work before: " + times.sunriseEnd + " and after " + times.sunsetStart );



