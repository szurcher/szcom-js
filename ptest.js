/** ptest.js *********************************************************
 *
 * Author: Stephen Zurcher <stephen.zurcher@gmail.com>
 * License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause
 *
 *********************************************************************/
(function(window, undefined) {
  // load namespace or create it
  var _sz = window.sz || {};

  // shim clear method into 2d canvas rendering context
  // http://jsfiddle.net/wYA9y/
  CanvasRenderingContext2D.prototype.clear = CanvasRenderingContext2D.prototype.clear ||
    function() {
      this.save();
      this.globalCompositeOperation = 'destination-out';
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

  // because
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

  // define ptest
  _sz.ptest = {
    '_MIN_SPEED': 250, // pixels (per second)
    '_MAX_SPEED': 350,

    'elClass': 'ptest',
    'mainCanvas': null,
    'animObjects': [],

    'animate': null, // animation loop function
    'Firefly': null // canvas graphic object
  };

  _sz.ptest.animate = function() {
    for(i = 0;i < _sz.ptest.animObjects.length;i++) {
      _sz.ptest.animObjects[i]._update();
    }
  };

  _sz.ptest.Firefly = function() {
    this.gRI = _sz.getRandomInt;
    this.parent = _sz.ptest;
    this._min_wait = this.gRI(350, 750);
    this._max_wait = this.gRI(1500, 2500);

    this.bounced = 0;
    this.animate = false;
    this.parent.animObjects.push(this);
    this._init();
  };

  _sz.ptest.Firefly.prototype.flySize = 2;

  _sz.ptest.Firefly.prototype.refCanvas = (function(func) {
    var size = func.prototype.flySize,
      refCnvs = new _sz.Canvas({
        'width': size*4,
        'height': size*4,
        'cssWidth': (size*4) + 'px',
        'cssHeight': (size*4) + 'px'
      });

    refCnvs.render(function(context) {
      context.save();
//      context.fillStyle = 'white';
      context.fillStyle = 'rgba(190,190,255,0.8)';
//      context.fillStyle = 'rgb(160,160,160)';
      context.shadowColor = context.fillStyle;
      context.shadowBlur = size;
      context.shadowOffsetX = context.shadowOffsetY = 0;
      context.beginPath();
      context.arc(size*2, size*2, size, 0, 2*Math.PI, false);
      context.closePath();
//      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      context.fill();
      context.restore();
    });

    return refCnvs;
  })(_sz.ptest.Firefly);

  _sz.ptest.Firefly.prototype._directions = [
    [-1,0], // left
    [1,0], // right
    [0,-1], // up
    [0,1], // down
//    [-1,-1], // diag left up
//    [-1,1], // diag left down
//    [1,-1], // diag right up
//    [1,1] // diag right down
  ];

  _sz.ptest.Firefly.prototype._init = function() {
    var cnvs = this.parent.mainCanvas;

    if( cnvs !== undefined ) {
      this.max_x = cnvs.width();
      this.max_y = cnvs.height();
      this.x = this.startX = this.old_x = this.gRI(0, this.max_x);
      this.y = this.startY = this.old_y = this.gRI(0, this.max_y);

      this.speed = this.gRI(this.parent._MIN_SPEED, this.parent._MAX_SPEED);
      this.direction = this.gRI(0, this._directions.length - 1);

      this.startTime = Date.now();
      this.prevTime = this.startTime;
      this.time = null;
      this.bounced = 0;
    }
  };

  _sz.ptest.Firefly.prototype._set_position = function() {
    var changeX = Math.floor((this.speed*this._directions[this.direction][0]) * ((this.time-this.prevTime)/1000));
    var changeY = Math.floor((this.speed*this._directions[this.direction][1]) * ((this.time-this.prevTime)/1000));

    this.old_x = this.x;
    this.old_y = this.y;
    this.x += changeX;
    this.y += changeY;
  };

  _sz.ptest.Firefly.prototype._update = function() {
    var that = this;
    if(this.animate) {
      this.prevTime = this.time;
      this.time = Date.now() - this.startTime;

      if( this.bounced < 2 && this.time > 450 &&
        Math.floor(this.time % this.gRI(10, 50)) === 0 ) {
        var newDir = this.direction;
        var opts = null;
        switch(this.direction) {
          case 0: // left
            opts = [0, 2, 3/*4, 5*/];
            break;
 //         case 4: // diag left up
 //           opts = [0, 2, 4];
 //           break;
 //         case 5: // diag left down
 //           opts = [0, 3, 5];
 //           break;
          case 1: // right
            opts = [1, 2, 3/*6, 7*/];
            break;
 //         case 6: // diag right up
 //           opts = [1, 2, 6];
 //           break;
 //         case 7: // diag right down
 //           opts = [1, 3, 7];
 //           break;
          case 2: // up
            opts = [2, 1, 0/*4, 6*/];
            break;
          case 3: // down
            opts = [3, 1, 0/*5, 7*/];
            break;
        }
        this.direction = opts[this.gRI(0, opts.length - 1)];
        this.bounced++;
      }

      this._set_position();

      this._paint();

      if( this.x > this.max_x || this.x < 0-this.refCanvas.width() || this.y > this.max_y || this.y < 0-this.refCanvas.height() ) {
        this.animate = false;

        var wait = this.gRI(this._min_wait, this._max_wait);
        setTimeout(function() {
          that._init(); // out of bounds, do reset
          that.animate = true;
        }, wait);
      }
    }
  };

  _sz.ptest.Firefly.prototype._paint = function() {
    var that = this;
    this.parent.mainCanvas.render(function(ctx) {
      var obj = that;
      var i,
          refWidth = obj.refCanvas.width(), // stored img width
          refHeight = obj.refCanvas.height(), // stored img height
          dir = obj._directions[obj.direction]; // array w/x and y direction indicators

      ctx.save();
      ctx.beginPath();
      ctx.clearRect(obj.old_x, obj.old_y, refWidth, refHeight);

      ctx.drawImage(obj.refCanvas.get2DContext().canvas, obj.x, obj.y, refWidth, refHeight);
      ctx.closePath();
      ctx.restore();
    });
  };

  window.sz = _sz;

  (function($) {
    $(document).ready(function () {
      $(window, '#bg').on('resize', function(evt) {
        var $b = $('#bg'),
          $c = $('canvas');

        $c.each(function(idx) {
          $(this).width($b.width()).height($b.outerHeight());
          this.width = $b.width();
          this.height = $b.height();
        });
      });

      var $bg = jQuery('#bg'),
        numParts = 10, // number of particles running concurrently
        w = $bg.width(),
        h = $bg.outerHeight(),
        screen = new _sz.Canvas({
          'width': w,
          'height': h,
          'cssWidth': $bg.css('width'),
          'cssHeight': $bg.css('height')
        });

      screen.css({
        'z-index': '1',
        'position': 'absolute',
        'left': '0',
        'top': $bg.offset().top
      });
      screen.attach();

      sz.ptest.mainCanvas = screen;

      (numParts).times(function(i) {
        new sz.ptest.Firefly();
      });

      for(var i = 0; i < sz.ptest.animObjects.length; i++) {
        sz.ptest.animObjects[i].animate = true;
      }

      sz.ptest.mainCanvas.animate(sz.ptest.animate);
    });
  })(jQuery);
})(window);
