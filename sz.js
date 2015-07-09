/*"""
sz.js
=======

Author: Stephen Zurcher <stephen.zurcher@gmail.com>
License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause

Base namespace include and utility functions

UUID: 93f15a42-4f3b-4388-be78-9d482e982346
Global var: window._93f15a424f3b4388be789d482e982346

*/

(function(window, undefined) {

  // a perhaps brilliant or horrible idea... use a UUID as library
  // global variable name (lead with underscore and remove hyphens).
  // Going to try it and if I don't run into any "aha! that's why not" issues
  // it will stick since (theoretically) no one else should ever come up with
  // this exact same variable name in a lifetime of lifetimes.
  var sz = (function(obj) {
    if( obj === undefined ||
      !(obj.hasOwnProperty("uuid")) ||
      obj.uuid !== "93f15a42-4f3b-4388-be78-9d482e982346" ) {
      var _sz = {};
      // store uuid
      _sz.uuid = "93f15a42-4f3b-4388-be78-9d482e982346";
      // init exceptions object
      _sz._exceptions = {};
      // init loaded object
      _sz._loaded = {};
      // init err object
      _sz._err = {};

      // version
      _sz.revision = "SmZ v " + "1.0.1";

      return _sz;
    }
    return obj;
  })(window._93f15a424f3b4388be789d482e982346); // don't clobber if already loaded

/*"""
Polyfill Page Visibility API
*/
  if( document.hidden === undefined ) {
    if( document.mozHidden !== undefined ) {
      document.hidden = document.mozHidden;
      document.visibilityChangeEvent = "mozvisibilitychange";
    }
    else if( document.msHidden !== undefined ) {
      document.hidden = document.msHidden;
      document.visibilityChangeEvent = "msvisibilitychange";
    }
    else if( document.webkitHidden !== undefined ) {
      document.hidden = document.webkitHidden;
      document.visibilityChangeEvent = "webkitvisibilitychange";
    }
  }
  else {
    document.visibilityChangeEvent = "visibilitychange";
  }

/*"""
Polyfill isArray (ie8 and lower)
*/
  Array.isArray = Array.isArray || function(arg) {
/*"""
.. function:: Array.isArray(arg)

  :param arg: Object to be tested
  :returns: true if object is an Array, false otherwise
*/
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
/**:isArray result tests

  >>> Array.isArray([]);
  true
  >>> Array.isArray([1]);
  true
  >>> Array.isArray(new Array());
  true
  >>> Array.isArray(Array.prototype);
  true

  >>> Array.isArray();
  false
  >>> Array.isArray({});
  false
  >>> Array.isArray(null);
  false
  >>> Array.isArray(undefined);
  false
  >>> Array.isArray(17);
  false
  >>> Array.isArray('Array');
  false
  >>> Array.isArray(true);
  false
  >>> Array.isArray(false);
  false
  >>> Array.isArray({ __proto__: Array.prototype });
  false
*/

  var szE = sz._exceptions;

/*"""
SZAvailableError type
*/

  szE.SZAvailableError = function(name) {
/*"""
.. function:: sz._exceptions.SZAvailableError(name)

  :param string name: Property name that is unavailable
*/
    this.name = "SZAvailableError";
    this.message = "The property '" + name + "' already exists";
  };
  szE.SZAvailableError.prototype = Object.create(Error.prototype);
  szE.SZAvailableError.prototype.constructor = 
    szE.SZAvailableError;

/*"""
SZArgRequiredError type
*/

  szE.SZArgRequiredError = function(arg, message) {
/*"""
.. function:: sz._exceptions.SZArgRequiredError(arg[, message])

  :param string arg: Named argument that is required
  :param string msg: Optional message to override default
*/
    this.name = "SZArgRequiredError";

    this.argName = arg;

    if(message !== undefined) {
      this.message = message;
    }
    else {
      this.message = "A required argument to the function was undefined";
    }
  };
  szE.SZArgRequiredError.prototype = Object.create(Error.prototype, {
    'argName': {
      'value': null,
      'enumerable': true,
      'configurable': true,
      'writable': true
    }
  });
  szE.SZArgRequiredError.prototype.constructor = szE.SZArgRequiredError;

/*"""
Allow scripts to flag that they have loaded
*/
  sz.setAvailable = function(prop) {
/*"""
.. function:: sz.setAvailable(prop)

  :param string prop: The unique property/script name being activated
  :returns: true if successful, throws SZAvailableError otherwise
*/
    if(sz._loaded.hasOwnProperty(prop)) {
      throw new sz._exceptions.SZAvailableError(prop);
    }

    sz._loaded[prop] = true;
    return true;
  };
/**:Verify setAvailable return for new or repeated names

  >>> sz.setAvailable("testProp");
  true
  >>> var result = "";
  >>> try {
  ...   sz.setAvailable("testProp");
  ... } catch (e) {
  ...   result = "Error " + e.name + ": " + e.message;
  ... }
  >>> result;
  "Error SZAvailableError: The property 'testProp' already exists"
  >>> sz.setAvailable("testProp2");
  true
  >>> sz.setAvailable("testProp3");
  true
*/

/*"""
Check if prop(s)/script(s) is/are available (has/have been loaded)
*/

  sz.isAvailable = function(props) {
/*"""
.. function:: sz.isAvailable(props)

  :param mixed props:
    A string containing the name of a single property or an
    Array of such property strings
  :returns: true if all properties specified are available, otherwise false
*/
    if( typeof props === 'string' ) {
      return sz._loaded.hasOwnProperty(props);
    }
    else if( Array.isArray(props) ) {
      if( props.length > 0 ) {
        for(var i = 0; i < props.length; i++) {
          if( ! (sz._loaded.hasOwnProperty(props[i])) ) {
            return false;
          }
        }
        return true;
      }
    }

    return false;
  };
/**:Verify isAvailable results

  >>> for(var i = 4;i < 7;i++) {
  ...   sz.setAvailable("testProp" + i);
  ... }
  >>> sz.isAvailable("testProp4");
  true
  >>> sz.isAvailable("testProp5");
  true
  >>> sz.isAvailable("testProp6");
  true
  >>> sz.isAvailable(["testProp4", "testProp6"]);
  true


  >>> sz.isAvailable("testProp7");
  false
  >>> sz.isAvailable();
  false
  >>> sz.isAvailable(1);
  false
  >>> sz.isAvailable([]);
  false;
  >>> sz.isAvailable({});
  false;
*/

/*"""
Polyfill :func:`CanvasRenderingContext2D.prototype.clear`
http://jsfiddle.net/wYA9y/
*/

  CanvasRenderingContext2D.prototype.clear =
/*"""
.. function:: CanvasRenderingContext2D.prototype.clear([callback])

  :param callback: Gets called with the object. Should define a shape to clear
*/
    CanvasRenderingContext2D.prototype.clear ||
    function(shapeFunc) {
      this.save();
      this.globalCompositeOperation = 'destination-out';
      if( shapeFunc !== undefined ) {
        shapeFunc(this);
      }
      else {
        this.rect(0,0,this.width,this.height);
      }
      this.fill();
      this.restore();
    };

/*"""
Polyfill :func:`Date.now` using `(new Date()).getTime()`
*/

  Date.now = Date.now || function() {
/*"""
.. function:: Date.now()

  :returns: timestamp for current time
*/
    return (new Date()).getTime();
  };
/**:Verify Date.now() method exists

  >>> Date.now
  function ...
*/

/*"""
Polyfill for :func:`requestAnimationFrame` using :func:`setTimeout`
*/

  window.requestAnimFrame = window.requestAnimFrame || (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
/*"""
.. function:: window.requestAnimFrame(callback)

  :param callback: Is passed to setTimeout
  :returns: integer identifier for the timer
*/
        var intervalId = window.setTimeout(callback, 1000 / 60);
        return intervalId;
      };
  })();
/**:Verify window.requestAnimFrame method exists

  >>> window.requestAnimFrame
  function ...
*/

/*"""
Polyfill for :func:`cancelAnimationFrame` using :func:`clearTimeout`
*/

  window.cancelAnimFrame = window.cancelAnimFrame || (function(id) {
    return window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.webkit.CancelRequestAnimationFrame ||
      window.oCancelAnimationFrame || window.msCancelAnimationFrame ||
      function(id) {
/*"""
.. function:: window.cancelAnimFrame(id)

  :param int id: identifier of requested frame to cancel
*/
        window.clearTimeout(id);
      };
  })();
/**:Verify window.cancelAnimFrame method exists

  >>> window.cancelAnimFrame
  function ...
*/

  Number.prototype.times = Number.prototype.times || function(callback) {
/*"""
.. function:: Number.prototype.times(callback)

  :param callback: Called in a for loop with current loop index
  :returns: integer value of Number object

*/
    for(var i = 0;i < this; i++) {
      callback.call(this, i);
    }
    return this + 0;
  };
/**:Number.times test loop

  >>> (5).times(function(idx) {
  ...   print( idx );
  ... });
  01234
*/

  sz.getRandomInt = sz.getRandomInt || function(min, max) {
/*"""
.. function:: sz.getRandomInt(min, max)

  :param int min: Minimum value of random number
  :param int max: Maximum value of random number
  :returns: Integer in the range [min, max) (min inclusive, max exclusive)
*/
    return Math.floor(Math.random() * (max - min)) + min;
  };
/**:getRandomInt should return only integers between min (inclusive) and
    max (exclusive). e.g. [min,max)

  >>> var outOfBounds = false,
  ...   nonInteger = false;
  >>> for(var i = 0;i < 1000;i++) {
  ...   var rnd = sz.getRandomInt(1,5);
  ...   if(isNaN(rnd)) {
  ...     nonInteger = true;
  ...     break;
  ...   }
  ...   var x = parseFloat(rnd);
  ...   if(!((x|0) === x)) {
  ...     nonInteger = true;
  ...     break;
  ...   }
  ...   if(rnd < 1 || rnd >= 5) {
  ---     outOfBounds = true;
  ...     break;
  ...   }
  ... }
  >>> nonInteger;
  false
  >>> outOfBounds;
  false
*/

  sz.sinMotion = function(value, height, waveLength) {
/*"""
.. function:: sz.sinMotion(value, height, waveLength)

  :param value: Delta value for animation
  :param height: Amplitude of the sin wave
  :param waveLength: Wavelength (unsurprisingly) of the sin wave
  :returns: Numeric delta to be added to animation start position
*/
    if( waveLength === 0 || value === undefined ||
       height === undefined || waveLength === undefined ) {
      return 0; // linear motion fallback
    }
    
    return height * Math.sin((2 * Math.PI / waveLength) * value);
  };
/**:sinMotion tests

  >>> sz.sinMotion();
  0
  >>> sz.sinMotion(1);
  0
  >>> sz.sinMotion(1,1);
  0
  >>> sz.sinMotion(1,1,0);
  0
  >>> sz.sinMotion(300, 10, 4000);
  4.539904997395468
*/

  sz.linearMotionX = function(angle, speed) {
/*"""
.. function:: sz.linearMotionX(angle, speed)

  :param angle: Angle of travel path from the horizontal
  :param speed: Rate of travel along path
  :returns: coefficient of movement on x axis per unit of time
*/
    if( angle == 90 ) {
      return 0;
    }

    if( speed === undefined ) {
      throw new sz._exceptions.SZArgRequiredError('speed');
    }
    else {
      return speed / Math.tan(angle*Math.PI/180);
    }
  };
/**:linearMotionX tests

  >>> sz.linearMotionX(90, 100);
  0
  >>> sz.linearMotionX(90);
  0
  >>> sz.linearMotionX(65);
  Uncaught SZArgRequiredError ...
  >>> sz.linearMotionX(65, 100);
  46.630765815499856
*/

  sz.getAlpha = function(delta, rate) {
/*"""
.. function:: sz.getAlpha(delta, rate)

  :param delta: Delta value for animation
  :param rate: Period of time for a fade out/in cycle (ms)
  :returns: Alpha value between 0 and 1, inclusive [0,1]
*/
    // [0 - 1] percent of rate (which is in milliseconds) 
    var moment = (delta % rate)/rate,

    // [0 - 1] percent in a 2*PI cycle
    rad = 2*Math.PI*moment;

    // [0 - 1] value period shifted so 0 = 0, pi = 1, 2*pi = 0 
    // amplitude adjusted to 1, values adjusted to be from 0 instead of -1
    return 0.5*Math.cos(1/Math.PI*rad+Math.PI)+1;
  };
/**:getAlpha tests

  >>> sz.getAlpha(5000, 375);
  0.6070563696115259
  >>> sz.getAlpha(5000, 625);
  0.5
  >>> sz.getAlpha(132683709, 513);
  0.9225176861449359
*/

  // load into the global namespace
  window._93f15a424f3b4388be789d482e982346 = sz;
})(window);
