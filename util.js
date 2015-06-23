/** util.js *************************************************************
 *
 * Author: Stephen Zurcher <stephen.zurcher@gmail.com>
 * License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause
 *
 ***********************************************************************/

(function(window, undefined) {
  // load namespace or create it
  // normally, this file should be called first so it will create the namespace
  var _sz = window.sz || {};

  _sz._loaded = _sz._loaded || {};
  _sz._loaded.utils = true;

  // shim clear method into 2d canvas rendering context
  // http://jsfiddle.net/wYA9y/
  CanvasRenderingContext2D.prototype.clear =
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

  // shim Date.now
  Date.now = Date.now || function() {
    return (new Date()).getTime();
  };

  // shim requestAnimFrame
  window.requestAnimFrame = window.requestAnimFrame || (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  // shim cancelAnimFrame
  window.cancelAnimFrame = window.cancelAnimFrame || (function() {
    return window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.webkit.CancelRequestAnimationFrame ||
      window.oCancelAnimationFrame || window.msCancelAnimationFrame ||
      function(id) {
        window.clearTimeout(id);
      };
  })();

  // Number.times function - usage: (x).times(function(idx) {});
  Number.prototype.times = Number.prototype.times || function(callback) {
    for(var i = 0;i < this; i++) {
      callback.call(this, i);
    }
    return this + 0;
  };

  // make sure getRandomInt exists
  _sz.getRandomInt = _sz.getRandomInt || function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // calculate position on a sin plot based on params
  _sz.sinMotion = function(value, height, waveLength) {
    if( waveLength === 0 || value === undefined ||
       height === undefined || waveLength === undefined ) {
      return 0; // linear motion fallback
    }
    
    return height * Math.sin((2 * Math.PI / waveLength) * value);
  };

  // used in fireworks.js, snarfed it in here but may prove
  // too specific for general use (need to look it over again)
  _sz.linearMotionX = function(angle, speed) {
    if( angle == 90 ) {
      return 0;
    }
    return speed / Math.tan(angle*Math.PI/180);
  };

  // calculate opacity using a repeating cosine function
  _sz.getAlpha = function(delta, rate) {
    // [0 - 1] percent of rate (which is in milliseconds) 
    var moment = (delta % rate)/rate,

    // [0 - 1] percent in a 2*PI cycle
    rad = 2*Math.PI*moment;

    // [0 - 1] value period shifted so 0 = 0, pi = 1, 2*pi = 0 
    // amplitude adjusted to 1, values adjusted to be from 0 instead of -1
    return 0.5*Math.cos(1/Math.PI*rad+Math.PI)+1;
  };

  window.sz = _sz;
})(window);
