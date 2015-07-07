/** particle.js *********************************************************
 *
 * Author: Stephen Zurcher <stephen.zurcher@gmail.com>
 * License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause
 *
 *********************************************************************/
(function(window, undefined) {
  // load namespace or create it
  var _sz = window.sz || {};

  _sz._loaded = _sz._loaded || {};
  _sz._err = _sz._err || {};

  // require utils.js and canvas.js
  if( _sz._loaded.utils !== true ) { // utils not loaded
    _sz._err.particle = ["Utils not loaded"];
    return;
  }
  else if( _sz._loaded.canvas !== true ) { // canvas not loaded
    _sz._err.particle = ["Canvas not loaded"];
    return;
  }

  // define particle
  _sz.particle = {
    '_MIN_SPEED': 250, // pixels (per second)
    '_MAX_SPEED': 350,

    'elClass': 'particle',
    'mainCanvas': null,
    'animObjects': [],

    'animate': null, // animation loop function
    'Firefly': null // canvas graphic object
  };

  _sz.particle.animate = function() {
    _sz.particle.mainCanvas.render(function(ctx) {
      for(i = 0;i < _sz.particle.animObjects.length;i++) {
        _sz.particle.animObjects[i]._update(ctx);
      }
    });
  };

  _sz.particle.Firefly = function() {
    this.gRI = _sz.getRandomInt;
    this.parent = _sz.particle;
    this._min_wait = this.gRI(0, 350);
    this._max_wait = this.gRI(700, 1500);

    this.scale_factor = 0;
    this.bounced = 0;
    this.accel = 0;
    this.animate = false;
    this.parent.animObjects.push(this);
    this._init();
  };

  _sz.particle.Firefly.prototype.flySize = 2;

  _sz.particle.Firefly.prototype.refCanvas = (function(func) {
    var size = func.prototype.flySize,
      refCnvs = new _sz.Canvas({
        'width': size*4,
        'height': size*4,
        'cssWidth': (size*4) + 'px',
        'cssHeight': (size*4) + 'px'
      }),
      color = "rgba(255,255,217,0.6)";

    refCnvs.render(function(context) {
      context.save();
//      context.fillStyle = 'white';
      context.fillStyle = color;
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
  })(_sz.particle.Firefly);

  _sz.particle.Firefly.prototype._directions = [
    [-1,0], // left
    [1,0], // right
    [0,-1], // up
    [0,1], // down
//    [-1,-1], // diag left up
//    [-1,1], // diag left down
//    [1,-1], // diag right up
//    [1,1] // diag right down
  ];

  _sz.particle.Firefly.prototype._accelerators = [
    function(cX, cY) { return 0; }, // static
    function(cX, cY) {
      var aX = Math.abs(cX);
      var aY = Math.abs(cY);
      return Math.sqrt(aX*aX + aY*aY);
    }, // linear
    function(cX, cY) {
      var aX = Math.abs(cX);
      var aY = Math.abs(cY);
      var rnd = _sz.getRandomInt(5,12);
      return (aX*aX + aY*aY)/rnd;
    }, // exponential variations
    function(cX, cY) {
      return -1*(_sz.particle.Firefly.prototype._accelerators[1](cX,cY));
    }, // negative linear
    function(cX, cY) {
      return -1*(_sz.particle.Firefly.prototype._accelerators[2](cX,cY));
    } // negative exponential
  ];

  _sz.particle.Firefly.prototype._init = function() {
    var cnvs = this.parent.mainCanvas;

    if( cnvs !== undefined ) {
      this.max_x = cnvs.width();
      this.max_y = cnvs.height();
      this.x = this.startX = this.old_x = this.older_x = this.gRI(0, this.max_x);
      this.y = this.startY = this.old_y = this.older_y = this.gRI(0, this.max_y);

      this.speed = this.gRI(this.parent._MIN_SPEED, this.parent._MAX_SPEED);
      this.accel = this.gRI(0, this._accelerators.length-1);
      this.direction = this.gRI(0, this._directions.length - 1);
      this.scale_factor = 1 + (this.gRI(-33,33)/100);

      this.startTime = Date.now();
      this.prevTime = this.startTime;
      this.time = null;
      this.bounced = 0;
    }
  };

  _sz.particle.Firefly.prototype._accelerate = function(cX, cY) {
    this.speed += (this._accelerators[this.accel])(cX, cY);
  };

  _sz.particle.Firefly.prototype._set_position = function() {
    var changeX = Math.floor((this.speed *
      this.scale_factor *
      this._directions[this.direction][0]) *
      ((this.time-this.prevTime)/1000));

    var changeY = Math.floor((this.speed *
      this.scale_factor *
      this._directions[this.direction][1]) *
      ((this.time-this.prevTime)/1000));

    this._accelerate(changeX, changeY);
//    this.speed += (changeX*changeX + changeY*changeY)/5;

    this.older_x = this.old_x;
    this.older_y = this.old_y;
    this.old_x = this.x;
    this.old_y = this.y;
    this.x += changeX;
    this.y += changeY;
  };

  _sz.particle.Firefly.prototype._update = function(ctx) {
    var that = this;
    if(this.animate) {
      this.prevTime = this.time;
      this.time = Date.now() - this.startTime;

      var chance = Math.max(99 - this.bounced*10,0);

      if( this.gRI(0,100) < chance && this.time > 450 &&
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

      if( this.speed <= 0 ||
        (this.x === this.old_x &&
          this.y === this.old_y) ||
        this.x > this.max_x ||
        this.x < 0-this.refCanvas.width() ||
        this.y > this.max_y ||
        this.y < 0-this.refCanvas.height() ) {
        this.animate = false;

        this._clear(ctx);

        var wait = this.gRI(this._min_wait, this._max_wait);
        setTimeout(function() {
          that._init(); // out of bounds, do reset
          that.animate = true;
        }, wait);
      }
      else {
        this._paint(ctx);
      }
    }
  };

  _sz.particle.Firefly.prototype._clear = function(ctx) {
    var refWidth = this.refCanvas.width(), // stored img width
      refHeight = this.refCanvas.height(), // stored img height
      dirX = 1,
      dirY = 3;

    if(this.old_x < this.older_x) {
      dirX = 0;
    }
    if(this.old_y < this.older_y) {
      dirY = 2;
    }

    ctx.save();

    ctx.scale(this.scale_factor, this.scale_factor);

    var x = this.older_x,
    y = this.older_y,
    new_x = this.old_x,
    new_y = this.old_y,
    newXFunc = function(x,new_x) { return Math.max(x-1,new_x); };
    newYFunc = function(y,new_y) { return Math.max(y-1,new_y); };

    if(dirX === 0 && dirY == 2) { // left
      newYFunc = function(y,new_y) { return Math.min(y+1,new_y); };
    }
    else if(dirX == 1) { // right
      if(dirY == 3) {
        newXFunc = function(x,new_x) { return Math.min(x+1,new_x); };
      }
      else if(dirY == 2) {
        newXFunc = function(x,new_x) { return Math.min(x+1,new_x); };
        newYFunc = function(y,new_y) { return Math.min(y+1,new_y); };
      }
    }

    for(x,y; ; x=newXFunc(x,new_x),y=newYFunc(y,new_y)) {
      ctx.clearRect(x-1,y-1,refWidth+2,refHeight+2);
      if(x === new_x && y === new_y) {
        break;
      }
    }

    ctx.restore();
  };

  _sz.particle.Firefly.prototype._paint = function(ctx) {
      var obj = this;
      var i,
          refWidth = obj.refCanvas.width(), // stored img width
          refHeight = obj.refCanvas.height(), // stored img height
          dir = obj._directions[obj.direction]; // array w/x and y direction indicators

      obj._clear(ctx);
      ctx.save();

      ctx.scale(obj.scale_factor, obj.scale_factor);

      var c = obj.refCanvas.get2DContext().canvas,
        dirX = 1, // right
        dirY = 3; // down

      // determine direction of movement
      // (changes sign of operation for motion blur effect)
      if(obj.x < obj.older_x) {
        dirX = 0; // left
      }
      if(obj.y < obj.older_y) {
        dirY = 2; // up
      }

      var x = obj.old_x,
      y = obj.old_y,
      new_x = obj.x,
      new_y = obj.y,
      alphaStep = Math.min(1/(obj.old_x - obj.x), 1/(obj.old_y - obj.y)),
      newXFunc = function(x,new_x) { return Math.max(x-1,new_x); },
      newYFunc = function(y,new_y) { return Math.max(y-1,new_y); };

      // set motion blur stepping values
      if( dirX === 0 && dirY == 2) { // left, up (left,down is preset)
        newYFunc = function(y,new_y) { return Math.min(y+1,new_y); };
        alphaStep = Math.min(1/(x - new_x), 1/(new_y - y));
      }
      else if( dirX == 1 ) { // right
        if( dirY == 3 ) { // down
          newXFunc = function(x,new_x) { return Math.min(x+1,new_x); };
          alphaStep = Math.min(1/(new_x - x), 1/(y - new_y));
        }
        else if( dirY == 2 ) { // up
          newXFunc = function(x,new_x) { return Math.min(x+1,new_x); };
          newYFunc = function(y,new_y) { return Math.min(y+1,new_y); };
          alphaStep = Math.min(1/(x - new_x), 1/(y - new_y));
        }
      }

      ctx.globalAlpha = 0.1;

      // blit image to canvas with motion blur effect
      for(x,y; ; x=newXFunc(x,new_x),y=newYFunc(y,new_y)) {
        ctx.drawImage(c, x, y, refWidth, refHeight);
        ctx.globalAlpha = Math.min(ctx.globalAlpha + alphaStep, 1);

        if( x === new_x && y === new_y ) {
          break;
        }
      }
      ctx.restore();
  };

  _sz.particle.load = function() {
    var $bg = jQuery('#bg'),
      numParts = 20, // number of particles running concurrently
      w = $bg.width(),
      h = $bg.outerHeight(),
      screen = new _sz.Canvas({
        'width': w,
        'height': h,
        'cssWidth': $bg.css('width'),
        'cssHeight': $bg.css('height'),
        'parent': '#bg',
        'szParent': '#bg',
        'runAnimation': true
      });

    screen.css({
      'z-index': '1',
      'position': 'absolute',
      'left': '0',
      'top': '0'
    });
    screen.attach();

    _sz.particle.mainCanvas = screen;

    (numParts).times(function(i) {
      tmp = new _sz.particle.Firefly();
      tmp.animate = true;
    });

    _sz.particle.mainCanvas.animate(_sz.particle.animate);

    (function($) {
      $(document).ready(function () {
        var cvs = _sz.particle.mainCanvas;

        if( cvs !== undefined ) {
          $(window, '#bg').on('resize', {
            'canvas': cvs
          },
          cvs.onresize_func);
        }
      });
    })(jQuery);
  };

  _sz.particle.unload = function() {
    var sp = _sz.particle;

    sp.mainCanvas.stop(); // kill animation loop

    sp.animObjects.length = 0; // dereference Firefly objects

    sp.mainCanvas.remove(); // remove from DOM
    sp.mainCanvas = undefined; // dereference for gc
  };

  _sz._loaded.particle = true;
  window.sz = _sz;

})(window);