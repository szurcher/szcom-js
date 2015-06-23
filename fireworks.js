/** fireworks.js ***********************************************************
 *
 * Author: Stephen Zurcher <stephen.zurcher@gmail.com>
 * License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause
 *
 ************************************************************************/
(function( window, undefined ) {
  // load namespace or create it
  var _sz = window.sz || {};

  _sz._loaded = _sz._loaded || {};
  _sz._err = _sz._err || {};

  // require utils.js and canvas.js
  if( _sz._loaded.utils !== true ) { // utils not loaded
    _sz._err.fireworks = ["Utils not loaded"];
    return;
  }
  else if( _sz._loaded.canvas !== true ) { // canvas not loaded
    _sz._err.fireworks = ["Canvas not loaded"];
    return;
  }

  _sz.fireworks = {
    _MIN_SPEED:  100, // y pixels
    _MAX_SPEED:  250,

    _MIN_BLOOM_SPEED: 95, // y pixels
    _MAX_BLOOM_SPEED: 125,

    _MIN_DISSOLVE_SPEED: 1250, // y pixels
    _MAX_DISSOLVE_SPEED: 1750,

    _MIN_ANGLE: 88,
    _MAX_ANGLE: 92,

    // keep safely above 334 - http://www.w3.org/TR/UNDERSTANDING-WCAG20/seizure.html
    _MIN_FLICKER_SPEED: 375, // ms 
    _MAX_FLICKER_SPEED: 625,

    _MIN_BURST_HEIGHT: 45, // percent of canvas height
    _MAX_BURST_HEIGHT: 90,

    _MIN_PARTICLES: 12, // for bloom
    _MAX_PARTICLES: 20,

    _MAX_OBJECTS: 6, // on screen at a time

    _SIZE: 2.5,
    _TRAIL: 1,  // too inefficient, but don't
                // want to recode to not clear screen >_>

    _flies: [],
    _flowers: [],
    _colors: [
      '255,255,255,', //'white',
      '236,11,21,', //'red',
      '136,209,145,', //'green',
      '156,120,187,',//'purple',
      '247,146,30,',//'orange',
      '34,153,255,', //'blue',
      '231,216,88,', //'yellow',
    ],
    mainCanvas: undefined,

    load: function() {
      var $bg = jQuery('#bg'),
        w = $bg.width(),
        h = $bg.outerHeight(),
        fw = _sz.fireworks;

      fw.mainCanvas = new _sz.Canvas({
        'width': w,
        'height': h,
        'cssWidth': $bg.css('width'),
        'cssHeight': $bg.css('height'),
        'parent': '#bg',
        'szParent': '#bg',
        'runAnimation': true
      });

      fw.mainCanvas.css({
        'z-index': '1',
        'position': 'absolute',
        'left': '0',
        'top': '0'
      });

      fw.mainCanvas.attach().animate(fw.init);

      // resize canvas to match screen
      jQuery(document).ready(function() {
        var cvs = _sz.fireworks.mainCanvas;

        if( cvs !== undefined ) {
          jQuery(window, '#bg').on('resize', {
            'canvas': cvs
          },
          cvs.onresize_func);
        }
      });
    },

    unload: function() {
      var fw = _sz.fireworks;

      fw.mainCanvas.stop();
      fw._flies.length = fw._flowers.length = 0;
      fw.mainCanvas.remove();
      fw.mainCanvas = undefined;
    },

    // initialize and run fireworks animation
    // -- context - main canvas 2d context
    init: function() {
      // effectively a while loop with counter, i is used as an id
      for(var i = 0; _sz.fireworks._flies.length < _sz.fireworks._MAX_OBJECTS; i++) {
        _sz.fireworks._flies.push(new _sz.fireworks.Fly(i));
      }

      _sz.fireworks.mainCanvas.render(function(ctx) {
        ctx.save();
        ctx.translate(0.5,0.5);
        for(i = 0; i < _sz.fireworks._flies.length; i++) {
          // update existing objects for next frame
          _sz.fireworks._flies[i]._animation(_sz.linearMotionX, ctx);
        }

        for(i = 0; i < _sz.fireworks._flowers.length; i++) {
          // update any 'flowers' (bursts), too
          _sz.fireworks._flowers[i]._animation(ctx);
        }
        ctx.restore();
      });
    },

    rmFlower: function(id) {
      var fw = _sz.fireworks;
      // find object in array and splice out (garbage collect)
      for(i = 0;i < fw._flowers.length;i++) {
        if( fw._flowers[i].id === id ) {
          fw._flowers.splice(i,1);
          return;
        }
      }
      if( console !== undefined ) {
        console.log("Error: sz.Flower with id of " + id + " not found.");
      }
    },

    // Object that displays rocket launch and travel.
    // Triggers a 'flower' (burst) at end of path.
    Fly: function(idx) {
      this.flyId = idx;
      this.animate = true;
      this._reset();
    },

    // object that displays burst effect
    Flower: function(pointX, pointY, colorIdx, id) {
      this.animate = true;
      this.id = id;
      this.startX = pointX;
      this.startY = pointY;
      this.colorIdx = colorIdx;
      this.particles = []; // x,y coords of each particle
      this.makeRefCanvas();
      this._init();
    }
  };

  // set random values, number of particles, speed, duration
  _sz.fireworks.Flower.prototype._init = function() {
    var gRI = _sz.getRandomInt,
        fw = _sz.fireworks,
        numParticles = gRI(fw._MIN_PARTICLES, fw._MAX_PARTICLES);

    this.speed = gRI(fw._MIN_BLOOM_SPEED, fw._MAX_BLOOM_SPEED);
    this.dissolveTime = gRI(fw._MIN_DISSOLVE_SPEED, fw._MAX_DISSOLVE_SPEED);
    
    for(var i = 0;i < numParticles;i++) {
      this.particles[i] = {
        x: this.startX,
        y: this.startY,
        histX: [], // stored previous x coords
        histY: [] // stored previous y coords
      };
    }
    
    this.startTime = (new Date()).getTime();
    this.time = null;
  };

  _sz.fireworks.Flower.prototype._clear = function(ctx) {
    var rC = this.refCanvas.get2DContext().canvas;
    var rCW = rC.width,
      rCH = rC.height;

    ctx.save();
    for(i = 0;i < this.particles.length;i++) {
      var part = this.particles[i];

      for(j = 0;j < part.histX.length;j++) {
        ctx.clearRect(part.histX[j]-2, part.histY[j]-2, rCW+4, rCH+4);
      }
      ctx.clearRect(part.x-2, part.y-2, rCW+4, rCH+4);
    }
    ctx.restore();
  };

  // calculate new values for movement in animation frame
  _sz.fireworks.Flower.prototype._animation = function(ctx) {
    var i, j, part,
      fw = _sz.fireworks;

    if( this.animate ) {
      var len = this.particles.length;
      this.time = (new Date()).getTime() - this.startTime;

      if( this.time >= this.dissolveTime ) {
        this._clear(ctx);
        fw.rmFlower(this.id);

        return;
      }

      for(i = 0;i < len;i++) {
        var angle = 2*Math.PI/len * i,
            hypLen = this.speed * this.time / 1000;

        part = this.particles[i];

        if( fw._TRAIL > 0 ) {
          // add last position to history
          part.histX.push(part.x);
          part.histY.push(part.y);

          // remove oldest position from history
          if( part.histX.length > fw._TRAIL ) {
            part.histX.shift();
            part.histY.shift();
          }
        }

        // vertical movement adjusted to suggest effect of gravity
        part.y = this.startY - Math.sin(angle)*hypLen +
          2*(0.0098*3.5*this.time);

        // horizontal movement adjusted to suggest effect of drag
        part.x = this.startX + Math.cos(angle) * 
          (hypLen-Math.pow(0.000125*3.5*this.time,2));
      }

      this._clear(ctx); // clear previous, no reset
      this._render(ctx);
    }
  };

  _sz.fireworks.Flower.prototype.makeRefCanvas = function() {
    var fw = _sz.fireworks,
      refCnvs = new _sz.Canvas({
        'width': fw._SIZE*4,
        'height': fw._SIZE*4,
        'cssWidth': (fw._SIZE*4) + 'px',
        'cssHeight': (fw._SIZE*4) + 'px',
      }),
      color = 'rgba(' + fw._colors[this.colorIdx] + '1)';
      shdwColor = 'rgba(' + fw._colors[this.colorIdx] + '0.4)';

      refCnvs.render(function(ctx) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = shdwColor;
        ctx.shadowBlur = ctx.width;
        ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

        ctx.beginPath();
        ctx.arc(Math.floor(ctx.canvas.width/2),
          Math.floor(ctx.canvas.height/2), _sz.fireworks._SIZE, 0, 2*Math.PI,
          false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

    this.refCanvas = refCnvs;
    return refCnvs;
  };

  // draw each particle as a filled circle
  _sz.fireworks.Flower.prototype._render = function(ctx) {
    var alpha = 1,
      fw = _sz.fireworks,
      rC = this.refCanvas.get2DContext().canvas;

    var rCW = rC.width,
      rCH = rC.height;

    ctx.save();
    for(var i = 0;i < this.particles.length;i++) {
      var p = this.particles[i],
        gA = ctx.globalAlpha,
        len = p.histX.length;

      for(var j = 0;j < len;j++) {
        ctx.globalAlpha = 1*(j+1)/len;
        ctx.drawImage(rC, p.x, p.y, rCW, rCH);
      }
      ctx.globalAlpha = gA;
      ctx.drawImage(rC, p.x, p.y, rCW, rCH);
    }
    ctx.restore();
  };

  // calculate new starting values once an animation sequence is complete
  _sz.fireworks.Fly.prototype._reset = function() {
    var gRI = _sz.getRandomInt;
    var fw = _sz.fireworks,
      canvasHeight = fw.mainCanvas.height();

    this.x = this.startX = gRI(100, fw.mainCanvas.width() - 100);
    this.y = this.startY = canvasHeight;

    this.colorIdx = gRI(0, (fw._colors.length - 1));
    this.speed = gRI(fw._MIN_SPEED, fw._MAX_SPEED);
    this.angle = gRI(fw._MIN_ANGLE, fw._MAX_ANGLE); // within several degrees of 90
    this.flickerSpeed = gRI(fw._MIN_FLICKER_SPEED, fw._MAX_FLICKER_SPEED);
    this.burstHeight = this.startY - Math.floor(canvasHeight * 
      gRI(fw._MIN_BURST_HEIGHT, fw._MAX_BURST_HEIGHT)/100
    );

    this.startTime = (new Date()).getTime();
    this.time = null;
  };

  // calculate new position for animation frame
  _sz.fireworks.Fly.prototype._animation = function(funcMoveX, ctx) {
    if( this.animate ) {
      ctx.clearRect(this.x, this.y, _sz.fireworks._SIZE+1,
        2*(_sz.fireworks._SIZE+1));

      this.time = (new Date()).getTime() - this.startTime;
      var new_y = this.startY - this.speed * this.time / 1000,
//      new_x = this.x + funcMoveX(this.angle, this.speed);
        new_x = this.x;

      // remember y starts at 0 at top of screen and grows downward
      // so once the upward fired rocket surpasses it's intended
      // altitude, trigger explosion and reset
      // also short circuit and explode if drifting off-screen
      if( new_y <= this.burstHeight /*||
        new_x <= 0 ||
        new_x >= document.body.clientWidth*/ ) {
        this._burst();
        this._reset();
      }
      else {
        this.y = new_y;
        this.x = new_x;
      }

      this._redraw(ctx);
    }
  };

  // create a new burst animation object
  _sz.fireworks.Fly.prototype._burst = function() {
    var flw = _sz.fireworks._flowers;

    flw.push(new _sz.fireworks.Flower(this.x-1, this.y,
      this.colorIdx, this.flyId + '-' + (new Date().getTime())));
  };

  // draw rectangle to represent rocket
  _sz.fireworks.Fly.prototype._redraw = function(ctx) {
    var alpha = _sz.getAlpha(this.time, this.flickerSpeed),
      fw = _sz.fireworks;

    ctx.save();
    ctx.fillStyle = 'rgba(' + fw._colors[this.colorIdx] + alpha + ')';
    ctx.fillRect(this.x, this.y, fw._SIZE, 2*fw._SIZE);
    ctx.restore();
  };

  // callable function to begin animation
  _sz.fireworks.Fly.prototype.startAnimation = function() {
    if( !this.animate ) {
      this.animate = true;
      this._animation(_sz.linearMotionX);
    }
  };

  // callable function that will freeze animation after
  // current frame
  _sz.fireworks.Fly.prototype.stopAnimation = function() {
    this.animate = false;
  };

  _sz._loaded.fireworks = true;
  window.sz = _sz;
})(window);
