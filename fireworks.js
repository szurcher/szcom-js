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

  _sz.renderFlyToCanvas = function(flyId, renderFunction, buffer) {
    var $buf;
    if( buffer !== undefined ) {
      $buf = buffer;
    }
    else {
      $buf = jQuery('canvas.fw.buffer');
    }

    if( $buf.length ) {
      var buf = $buf.get(0);
      renderFunction(flyId, buf.getContext('2d'));
    }
  };

  _sz.renderFlowerToCanvas = function(obj, renderFunction, buffer) {
    var $buf;
    if( buffer !== undefined ) {
      $buf = buffer;
    }
    else {
      $buf = jQuery('canvas.fw.buffer');
    }

    if( $buf.length ) {
      var buf = $buf.get(0);
      renderFunction(obj, buf.getContext('2d'));
    }
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

    // initialize and run fireworks animation
    // -- context - main canvas 2d context
    init: function(context) {
      var $b = jQuery('body');
      context.save();
      context.clearRect(0, 0, $b.width(), $b.height());

      // get buffer canvas object, or create and attach it to the body
      var $buf = jQuery('canvas.fw.buffer');
      if( !$buf.length ) {
        $buf = jQuery('<canvas>')
                .addClass('buffer')
                .addClass('fw')
                .appendTo($b)
                .width($b.width())
                .height($b.height())
                .css('position', 'fixed')
                .css('left', '-100%')
                .css('top', '-10px')
                .css('z-index', '1');

        $buf.get(0).width = $b.width();   // set width and height to body params
        $buf.get(0).height = $b.height();
      }

      var buf = $buf.get(0);
      var ctx = buf.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, buf.width, buf.height);

      // effectively a while loop with counter, i is used as an id
      for(var i = 0; _sz.fireworks._flies.length < _sz.fireworks._MAX_OBJECTS; i++) {
        _sz.fireworks._flies.push(new _sz.fireworks.Fly(i));
      }

      for(i = 0; i < _sz.fireworks._flies.length; i++) {
        _sz.fireworks._flies[i]._animation(_sz.linearMotionX); // update existing objects for next frame
      }

      for(i = 0; i < _sz.fireworks._flowers.length; i++) {
        _sz.fireworks._flowers[i]._animation(); // update any 'flowers' (bursts), too
      }

      context.drawImage(buf, 0, 0); // copy from buffer to main canvas

      ctx.restore();
      context.restore();

      // loop next frame
      requestAnimFrame(function() {
        _sz.fireworks.init(context);
      });
    },

    // object that displays rocket launch and travel and triggers a 'flower' (burst) at end of path
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


    this.canvas = jQuery('canvas.fw').get(0);

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
  _sz.fireworks.Flower.prototype._animation = function() {
    var i;
    if( this.animate ) {
      var len = this.particles.length;
      this.time = (new Date()).getTime() - this.startTime;

      if( this.time > this.dissolveTime ) {
        // find object in array and splice out (garbage collect)
        for(i = 0;i < _sz.fireworks._flowers.length;i++) {
          if( _sz.fireworks._flowers[i].id === this.id ) {
            _sz.fireworks._flowers.splice(i,1);
            return;
          }
        }
      }
      else {
        for(i = 0;i < len;i++) {
          var part = this.particles[i],
              angle = 2*Math.PI/len * i,
              hypLen = this.speed * this.time / 1000;

          if( _sz.fireworks._TRAIL > 0 ) {
            // add last position to history
            part.histX.push(part.x);
            part.histY.push(part.y);

            // remove oldest position from history
            if( part.histX.length > _sz.fireworks._TRAIL ) {
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

        _sz.renderFlowerToCanvas(this, this._render);
      }
    }
  };

  // draw each particle as a filled circle
  _sz.fireworks.Flower.prototype._render = function(obj, context) {
    context.save();
    var alpha = 1;

    context.fillStyle = 'rgba(' + _sz.fireworks._colors[obj.colorIdx] + alpha + ')';
    context.shadowColor = 'rgba(255,255,255,0.4)';
    context.shadowBlur = _sz.fireworks._SIZE*4;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    for(var i = 0;i < obj.particles.length;i++) {
      var p = obj.particles[i];
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
    var fw = _sz.fireworks;

    this.canvas = jQuery('canvas.fw').get(0);

    this.startX = gRI(100, this.canvas.width - 100);
    this.startY = document.body.clientHeight;
    this.x = this.startX;
    this.y = this.startY;

    this.colorIdx = gRI(0, fw._colors.length);
    if( this.colorIdx == fw._colors.length ) {
      this.colorIdx -= 1;
    }
    this.speed = gRI(fw._MIN_SPEED, fw._MAX_SPEED);
    this.angle = gRI(fw._MIN_ANGLE, fw._MAX_ANGLE); // within several degrees of 90
    this.flickerSpeed = gRI(fw._MIN_FLICKER_SPEED, fw._MAX_FLICKER_SPEED);
    this.burstHeight = this.startY - Math.floor(document.body.clientHeight * 
      gRI(fw._MIN_BURST_HEIGHT, fw._MAX_BURST_HEIGHT)/100
    );

    this.startTime = (new Date()).getTime();
    this.time = null;
  };

  // calculate new position for animation frame
  _sz.fireworks.Fly.prototype._animation = function(funcMoveX) {
    if( this.animate ) {
      this.time = (new Date()).getTime() - this.startTime;
      var new_y = this.startY - this.speed * this.time / 1000;
//      var new_x = this.x + funcMoveX(this.angle, this.speed);
      var new_x = this.x;

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

      this.y = new_y;
      this.x = new_x;

      this._redraw();
    }
  };

  // create a new burst animation object
  _sz.fireworks.Fly.prototype._burst = function() {
    var flw = _sz.fireworks._flowers;

    flw.push(new _sz.fireworks.Flower(this.x, this.y, this.colorIdx, this.i + '-' + (new Date().getTime())));
  };

  // draw rectangle to represent rocket
  _sz.fireworks.Fly.prototype._redraw = function() {
    _sz.renderFlyToCanvas(this.flyId, function(flyId, ctx) {
      var that = _sz.fireworks._flies[flyId];
      var alpha = _sz.setAlpha(that.time, that.flickerSpeed);

      ctx.save();
      ctx.fillStyle = 'rgba(' + _sz.fireworks._colors[0] + alpha + ')';
      ctx.fillRect(that.x, that.y, _sz.fireworks._SIZE, 2*_sz.fireworks._SIZE);
      ctx.restore();
    });
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

  (function($) {
    // create and attach canvas and default off-screen buffer
    var $b = $('body');
    var $c = $('<canvas>')
      .addClass('fw')
      .appendTo($b)
      .width($b.width())
      .height($b.height())
      .css('position', 'fixed')
      .css('left', '0')
      .css('top', '-10px')
//              .css('pointer-events', 'none')
      .css('z-index', '9999');

    var $buf = $('<canvas>')
      .addClass('buffer')
      .addClass('fw')
      .appendTo($b)
      .width($b.width())
      .height($b.height())
      .css('position', 'fixed')
      .css('left', '-100%')
      .css('top', '-10px')
      .css('z-index', '1');

    var c = $c.get(0);
    c.width = $b.width();
    c.height = $b.height();

    var buf = $buf.get(0);
    buf.width = c.width;
    buf.height = c.height;

    // resize canvas to match screen
    $(window).on('resize', function(eventObject) {
      var $b = $('body');
      var $c = $('canvas.fw:not(.buffer)');
      var $buf = $('canvas.fw.buffer');
      var c = $c.get(0);
      var buf = $buf.get(0);

      if( $c.length ) {
        $c.width($b.width()).height($b.height());
        c.width = $b.width();
        c.height = $b.height();
      }

      if( $buf.length ) {
        $buf.width(c.width).height(c.height);
        buf.width = c.width;
        buf.height = c.height;
      }
    });

    // start animation
//    $(document).ready(function() {
//      sz.fireworks.init(c.getContext('2d'));
//    });
  })(jQuery);
})(window);
