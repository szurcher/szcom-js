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

  _sz.setAlpha = function(delta, rate) {
        // [0 - 1] percent of rate (which is in milliseconds) 
    var moment = (delta % rate)/rate,

        // [0 - 1] percent in a 2*PI cycle
        rad = 2*Math.PI*moment,

        // [0 - 1] value period shifted so 0 = 0, pi = 1, 2*pi = 0 
        // amplitude adjusted to 1, values adjusted to be from 0 instead of -1
        opacity = 0.5*Math.cos(1/Math.PI*rad+Math.PI)+1;

        // convert decimal opacity percent to 0-255 scale
        return opacity*100/255;
  };

  _sz.getRandomInt = function(min, max) {
    // Math.round would not provide a uniform distribution
    return Math.floor(Math.floor(Math.random() * (max - min + 1)) + min);
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

  _sz.linearMotionX = function(angle, speed) {
    if( angle == 90 ) {
      return 0;
    }
    return speed / Math.tan(angle*Math.PI/180);
//    return 0;
  };

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
    _TRAIL: 0,  // too inefficient, but don't
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
        'szParent': '#bg',
        'runAnimation': true
      });

      fw.mainCanvas.css({
        'z-index': '1',
        'position': 'absolute',
        'left': '0',
        'top': $bg.offset().top
      });

      fw.mainCanvas.attach().animate(fw.init);

      // resize canvas to match screen
      jQuery(document).ready(function() {
        jQuery(window, '#bg').on('resize',
          sz.fireworks.mainCanvas.onresize_func);
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
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        for(i = 0; i < _sz.fireworks._flies.length; i++) {
          // update existing objects for next frame
          _sz.fireworks._flies[i]._animation(_sz.linearMotionX, ctx);
        }

        for(i = 0; i < _sz.fireworks._flowers.length; i++) {
          // update any 'flowers' (bursts), too
          _sz.fireworks._flowers[i]._animation(ctx);
        }
      });
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

  // calculate new values for movement in animation frame
  _sz.fireworks.Flower.prototype._animation = function(ctx) {
    var i,
      fw = _sz.fireworks;
    if( this.animate ) {
      var len = this.particles.length;
      this.time = (new Date()).getTime() - this.startTime;

      if( this.time > this.dissolveTime ) {
        // find object in array and splice out (garbage collect)
        for(i = 0;i < fw._flowers.length;i++) {
          if( fw._flowers[i].id === this.id ) {
            fw._flowers.splice(i,1);
            return;
          }
        }
      }
      else {
        for(i = 0;i < len;i++) {
          var part = this.particles[i],
              angle = 2*Math.PI/len * i,
              hypLen = this.speed * this.time / 1000;

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
          part.y = this.startY - Math.sin(angle)*hypLen + 2*(0.0098*3.5*this.time);

          // horizontal movement adjusted to suggest effect of drag
          part.x = this.startX + Math.cos(angle) * 
            (hypLen-Math.pow(0.000125*3.5*this.time,2));
        }

        this._render(ctx);
      }
    }
  };

  // draw each particle as a filled circle
  _sz.fireworks.Flower.prototype._render = function(context) {
    context.save();
    var alpha = 1,
      fw = _sz.fireworks;

    context.fillStyle = 'rgba(' + fw._colors[this.colorIdx] + alpha + ')';
    context.shadowColor = 'rgba(255,255,255,0.4)';
    context.shadowBlur = fw._SIZE*4;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    for(var i = 0;i < this.particles.length;i++) {
      var p = this.particles[i];
      for(var j = 0;j < p.histX.length;j++) {
        context.beginPath();
        context.arc(p.histX[j], p.histY[j], _sz.fireworks._SIZE, 2*Math.PI, false);
        context.closePath();
        context.fill();
      }
      context.beginPath();
      context.arc(p.x, p.y, _sz.fireworks._SIZE, 2*Math.PI, false);
      context.closePath();
      context.fill();
    }
    context.restore();
  };

  // calculate new starting values once an animation sequence is complete
  _sz.fireworks.Fly.prototype._reset = function() {
    var gRI = _sz.getRandomInt;
    var fw = _sz.fireworks,
      canvasHeight = fw.mainCanvas.height();

    this.x = this.startX = gRI(100, fw.mainCanvas.width() - 100);
    this.y = this.startY = canvasHeight;

    this.colorIdx = gRI(0, fw._colors.length);
    if( this.colorIdx == fw._colors.length ) {
      this.colorIdx -= 1;
    }
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

    flw.push(new _sz.fireworks.Flower(this.x, this.y, this.colorIdx,
     this.i + '-' + (new Date().getTime())));
  };

  // draw rectangle to represent rocket
  _sz.fireworks.Fly.prototype._redraw = function(ctx) {
    var alpha = _sz.setAlpha(this.time, this.flickerSpeed),
      fw = _sz.fireworks;

    ctx.save();
    ctx.fillStyle = 'rgba(' + fw._colors[0] + alpha + ')';
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

  window.sz = _sz;
})(window);
