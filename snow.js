/** Snow.js ***********************************************************
 *
 * Author: Stephen Zurcher <stephen.zurcher@gmail.com>
 * License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause
 *
 **********************************************************************/
(function( window, undefined ) {
  var _sz = {};

  // init with existing object if available
  if( window.sz !== undefined ) {
    _sz = window.sz;
  }

  window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  _sz.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // shim clear method into 2d canvas rendering context
  // http://jsfiddle.net/wYA9y/
  CanvasRenderingContext2D.prototype.clear =
    CanvasRenderingContext2D.prototype.clear ||
    function() {
      this.save();
      this.globalCompositeOperation = 'destination-out';
      this.fill();
      this.restore();
    };

  _sz.sinMotion = function(value, height, waveLength) {
    if( waveLength === 0 || value === undefined ||
       height === undefined || waveLength === undefined ) {
      return 0; // linear motion fallback
    }
    
    return height * Math.sin((2 * Math.PI / waveLength) * value);
  };


  _sz.snow = {
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

    animate: function() {
      var i = 0,
        sn = _sz.snow;
      if( sn.snow.length === 0 ) {
        for(i = 0;i < sn._NUM_OBJECTS;i++) {
          sn.snow.push(new sn.SnowDrop());
        }
      }

      sn.mainCanvas.render(function(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for(i = 0;i < sn.snow.length;i++) {
          sn.snow[i]._animation(_sz.sinMotion, ctx);
        }
      });
    },

    SnowDrop: function() {
      this.animate = true;
      this._reset();
    }
  };

  _sz.snow.SnowDrop.prototype._reset = function() {
    var sn = _sz.snow,
        gRI = _sz.getRandomInt;

    this.startX = gRI(0, sn.mainCanvas.width());
    this.startY = -1 * gRI(0, sn.mainCanvas.height());
    this.x = this.startX;
    this.y = this.startY;

    this.speed = gRI(sn._MIN_SPEED, sn._MAX_SPEED);
    this.amplitude = gRI(sn._MIN_AMP, sn._MAX_AMP);
    this.period = gRI(sn._MIN_PERIOD, sn._MAX_PERIOD);
  
    this.radius = gRI(sn._MIN_RADIUS, sn._MAX_RADIUS);
    this.startTime = (new Date()).getTime();
  };

  _sz.snow.SnowDrop.prototype._animation = function(funcMoveX, ctx) {
    if(this.animate) {
      var time = (new Date()).getTime() - this.startTime;
      this.y = this.startY + this.speed * time / 1000;

      if( this.amplitude === 0 || this.period === 0 ) {
        this.x = funcMoveX(this.y) + this.startX;
      }
      else {
        this.x = funcMoveX(time, this.amplitude, this.period) + this.startX;
      }

      if( this.y >= _sz.snow.mainCanvas.height() ) {
        this._reset();
      }

      this._redraw(ctx);
    }
  };

  _sz.snow.SnowDrop.prototype._redraw = function(ctx) {
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

  _sz.snow.SnowDrop.prototype.startAnimation = function() {
//    if( !this.animate ) {
      this.animate = true;
//      this._animation(_sz.sinMotion);
//    }
  };

  _sz.snow.SnowDrop.prototype.stopAnimation = function() {
    this.animate = false;
  };

  _sz.snow.load = function() {
    var $bg = jQuery('#bg'),
      w = $bg.width(),
      h = $bg.outerHeight(),
      sn = _sz.snow;

    sn.mainCanvas = new _sz.Canvas({
        'width': w,
        'height': h,
        'cssWidth': $bg.css('width'),
        'cssHeight': $bg.css('height'),
        'szParent': '#bg',
        'runAnimation': true
      });

    sn.mainCanvas.css({
      'z-index': '1',
      'position': 'absolute',
      'left': '0',
      'top': $bg.offset().top
    });

    sn.mainCanvas.attach().animate(sn.animate);

    jQuery(document).ready(function() {
      jQuery(window, '#bg').on('resize', sz.snow.mainCanvas.onresize_func);
    });
  };

  _sz.snow.unload = function() {
    var sn = _sz.snow;

    sn.mainCanvas.stop(); // kill anim loop
    sn.snow.length = 0; // dereference SnowDrop objects
    sn.mainCanvas.remove(); // remove from DOM
    sn.mainCanvas = undefined; // dereference for gc
  };

  window.sz = _sz;

//  (function($) {
//    $(document).ready(function() {
//    });
//  })(jQuery);
})(window);
