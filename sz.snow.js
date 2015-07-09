/*"""
sz.snow.js
==========

Author: Stephen Zurcher <stephen.zurcher@gmail.com>
License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause

*/
(function( window, undefined ) {
  // access root library
  var errMsg = "sz.snow.js requires sz.js to function. Load sz.js " +
    "before loading sz.snow.js";
  if( window._93f15a424f3b4388be789d482e982346 === undefined ) {
    throw new Error(errMsg);
  }

  // alias
  var sz = window._93f15a424f3b4388be789d482e982346;

  if( !(sz.hasOwnProperty("uuid")) || sz.uuid !==
    "93f15a42-4f3b-4388-be78-9d482e982346" ) {
    throw new Error(errMsg);
  }
  // root library accessible

  // require canvas.js
  if( !(sz.isAvailable("canvas")) ) {
    sz._err.snow = ["Canvas not loaded"];
    return;
  }

  sz.snow = {
    _MIN_SPEED: 15,
    _MAX_SPEED: 50,

    _MIN_AMP: 10,
    _MAX_AMP: 25,

    _MIN_PERIOD: 3000,
    _MAX_PERIOD: 7000,

    _MIN_RADIUS: 1,
    _MAX_RADIUS: 4,

    _NUM_OBJECTS: 75,

    snow: [],

    SnowDrop: function() {
      this.animate = true;
      this._reset();
    },

    SnowCanvas: function(opts) {
      sz.Canvas.call(this, opts);
    }
  };

  sz.snow.SnowCanvas.prototype = Object.create(sz.Canvas.prototype);
  sz.snow.SnowCanvas.prototype.constructor = sz.snow.SnowCanvas;
  sz.snow.SnowCanvas.prototype.restart = function() {
    if( this._pauseTime > 0 ) {
      var diff = Date.now() - this._pauseTime;
      if( diff > 0 ) {
        for(var i = 0;i < sz.snow.snow.length;i++) {
          sz.snow.snow[i]._timeAdjust += diff;
        }
      }
    }
    this.start(sz.snow.animate);
  };

  sz.snow.animate = function() {
    var i = 0,
      sn = sz.snow;
    if( sn.snow.length === 0 ) {
      for(i = 0;i < sn._NUM_OBJECTS;i++) {
        sn.snow.push(new sn.SnowDrop());
      }
    }

    sn.mainCanvas.render(function(ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for(i = 0;i < sn.snow.length;i++) {
        sn.snow[i]._animation(sz.sinMotion, ctx);
      }
    });
  };

  sz.snow.SnowDrop.prototype._reset = function() {
    var sn = sz.snow,
        gRI = sz.getRandomInt;

    this.startX = gRI(0, sn.mainCanvas.width());
    this.startY = -1 * gRI(0, sn.mainCanvas.height());
    this.x = this.startX;
    this.y = this.startY;

    this.speed = gRI(sn._MIN_SPEED, sn._MAX_SPEED);
    this.amplitude = gRI(sn._MIN_AMP, sn._MAX_AMP);
    this.period = gRI(sn._MIN_PERIOD, sn._MAX_PERIOD);
  
    this.radius = gRI(sn._MIN_RADIUS, sn._MAX_RADIUS);

    this._timeAdjust = 0;
    this.startTime = Date.now();
  };

  sz.snow.SnowDrop.prototype._animation = function(funcMoveX, ctx) {
    if(this.animate) {
      var time = (new Date()).getTime() - this.startTime - this._timeAdjust;
      this.y = this.startY + this.speed * time / 1000;

      if( this.amplitude === 0 || this.period === 0 ) {
        this.x = funcMoveX(this.y) + this.startX;
      }
      else {
        this.x = funcMoveX(time, this.amplitude, this.period) + this.startX;
      }

      if( this.y >= sz.snow.mainCanvas.height() ) {
        this._reset();
      }

      this._redraw(ctx);
    }
  };

  sz.snow.SnowDrop.prototype._redraw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI,false);
    ctx.closePath();
    ctx.fillStyle = '#fefefe';
    ctx.shadowColor = '#ccc';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fill();
  };

  sz.snow.SnowDrop.prototype.startAnimation = function() {
//    if( !this.animate ) {
      this.animate = true;
//      this._animation(sz.sinMotion);
//    }
  };

  sz.snow.SnowDrop.prototype.stopAnimation = function() {
    this.animate = false;
  };

  sz.snow.load = function(opts) {
    var $bg = jQuery('#bg'),
      w = $bg.width(),
      h = $bg.outerHeight(),
      sn = sz.snow;

    var _o = {
      'width': w,
      'height': h,
      'cssWidth': $bg.css('width'),
      'cssHeight': $bg.css('height'),
      'parent': '#bg',
      'szParent': '#bg',
      'runAnimation': true
    };

    if(opts !== undefined) {
      jQuery.extend(_o, opts);
    }

    sn.mainCanvas = new sz.snow.SnowCanvas(_o);

    sn.mainCanvas.css({
      'z-index': '1',
      'position': 'absolute',
      'left': '0',
      'top': '0'
    });

    sn.mainCanvas.attach().animate(sn.animate);

    jQuery(document).ready(function() {
      var cvs = sz.snow.mainCanvas;

      if( cvs !== undefined ) {
        var data = { 'canvas': cvs };
        jQuery(window, '#bg').on('resize', data, cvs.onresize_func);

        jQuery(document).on(
          document.visibilityChangeEvent,
          data,
          cvs.handleVisibilityChange
        );
      }
    });
  };

  sz.snow.unload = function() {
    var sn = sz.snow;

    sn.mainCanvas.stop(); // kill anim loop

    // stop listener so animation switching doesn't throw next load
    // into a bad state
    jQuery(document).off(
      document.visibilityChangeEvent,
      sn.mainCanvas.handleVisibilityChange
    );

    sn.snow.length = 0; // dereference SnowDrop objects
    sn.mainCanvas.remove(); // remove from DOM
    sn.mainCanvas = undefined; // dereference for gc
  };

  // tag module as loaded
  try {
    sz.setAvailable("snow");
  } catch (e) {
    if(e instanceof sz._exceptions.SZAvailableError) {
      return; // assume (perhaps dangerously) existing property is this
    }

    throw e;
  }

  // update global object
  window._93f15a424f3b4388be789d482e982346 = sz;
})(window);
