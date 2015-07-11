/*"""
sz.fireworks.js
===============

Author: Stephen Zurcher <stephen.zurcher@gmail.com>
License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause

*/

// must load sz.js script before this for script to function
(function( window, undefined ) {
  // access root library
  var errMsg = "sz.fireworks.js requires sz.js to function. Load sz.js " +
    "before loading sz.fireworks.js";
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
    sz._err.fireworks = ["Needs canvas loaded first"];
    return;
  }

  sz.fireworks = {
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

    _SIZE: 2,
    _TRAIL: 10,

    _flies: [],
    _flowers: [],
    _colors: [
      '255,255,255,', //'white',
//      '236,11,21,', //'red',
      '255,0,0,', //'red',
//      '136,209,145,', //'green',
      '0,255,0,', //'green',
//      '156,120,187,',//'purple',
      '135,0,255,',//'purple',
//      '247,146,30,',//'orange',
      '255,123,0,',//'orange',
//      '34,153,255,', //'blue',
      '0,0,255,', //'blue',
//      '231,216,88,', //'yellow',
      '255,255,0,', //'yellow',
    ],
    mainCanvas: undefined,
    _frame: 0,
    _idCounter: 0,

      // sub-class sz.Canvas so we can override restart
    FireworkCanvas: function(opts) {
      sz.Canvas.call(this, opts);
    }
  };

  sz.fireworks.FireworkCanvas.prototype = Object.create(sz.Canvas.prototype);
  sz.fireworks.FireworkCanvas.prototype.constructor =
    sz.fireworks.FireworkCanvas;
  sz.fireworks.FireworkCanvas.prototype.restart = function() {
    if( this._pauseTime > 0 ) {
      var diff = Date.now() - this._pauseTime;
      if( diff > 0 ) {
        var flies = sz.fireworks._flies,
          flowers = sz.fireworks._flowers;
        for(var i = 0; i < flies.length; i++) {
          flies[i]._timeAdjust += diff;
        }
        for(i = 0;i < flowers.length;i++) {
          flowers[i]._timeAdjust += diff;
        }
      }
    }
    this.start(sz.fireworks.animation);
  };

  sz.fireworks.load = function() {
    var $bg = jQuery('#bg'),
      w = $bg.width(),
      h = $bg.outerHeight(),
      fw = sz.fireworks;

    fw.mainCanvas = new fw.FireworkCanvas({
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

    fw.mainCanvas.attach().animate(fw.animation);

    // resize canvas to match screen
    jQuery(document).ready(function() {
      var cvs = sz.fireworks.mainCanvas;

      if( cvs !== undefined ) {
        jQuery(window, '#bg').on(
          'resize',
          {
            'canvas': cvs
          },
          cvs.onresize_func
        );

        // add event listener to make animation page visibility api aware
        jQuery(document).on(
          document.visibilityChangeEvent,
          {
            'canvas': cvs
          },
          cvs.handleVisibilityChange
        );
      }
    });
  };

  sz.fireworks.unload = function() {
    var fw = sz.fireworks;

    fw.mainCanvas.stop();

    jQuery(document).off(
      document.visibilityChangeEvent,
      fw.mainCanvas.handleVisibilityChange
    );

    for(var i = fw._flowers.length-1;i >= 0;i--) {
      fw.rmFlower(fw._flowers[i].id);
    }
    fw._flies.length = fw._flowers.length = 0;
    fw.mainCanvas.remove();
    fw.mainCanvas = undefined;
  };

  // initialize and run fireworks animation
  // -- context - main canvas 2d context
  sz.fireworks.animation = function() {
    var fw = sz.fireworks;

    if(!fw.mainCanvas._opts.runAnimation) {
      return;
    }

    // fill/refill rocket array
    for(var i = fw._flies.length; i < fw._MAX_OBJECTS; i++) {
      fw._flies.push(new fw.Fly(fw._idCounter++));
      fw._idCounter = fw._idCounter % fw._MAX_OBJECTS;
    }

    fw.mainCanvas.render(function(ctx) {
      var i = 0, j = 0, k = 0,
        fw = sz.fireworks,
        rC = null,
        rCW = 0,
        rCH = 0,
        flower = null,
        p = null,
        len = 0;

      ctx.save();

      // too many tiny objects and  blur, faster to clear whole buffer canvas
      ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);

      ctx.translate(0.5,0.5); // sub-pixel align

      // update and render existing rockets
      for(i = 0; i < fw._flies.length; i++) {
        fw._flies[i]._animation(ctx);
      }

      // update and render flower bursts
      for(i = 0; i < fw._flowers.length; i++) {
        flower = fw._flowers[i];

        flower._animation(ctx); // position change calculations

        if(flower._remove) { // splice out of array
          fw.rmFlower(flower.id);
          i--; // yay looping through a non-static length array
        }
        else { // render
          rC = flower.refCanvas.get2DContext().canvas;
          rCW = rC.width;
          rCH = rC.height;

          // fade out flower
          // cubic out:  t /= d; t--; return b - c*(t*t*t+1)
          // t = flower.time, b = 1, c = t/d, d = flower.dissolveTime
          var gA = flower.time/flower.dissolveTime - 1;
          gA = 1 - flower.time/flower.dissolveTime*(Math.pow(gA,3)+1);
          ctx.globalAlpha = gA;

          for(j = 0;j < flower.particles.length;j++) {
            p = flower.particles[j];
            len = p.histX.length;

            // draw tail
            for(k = 0;k < len;k++) {
              ctx.globalAlpha = gA*(k+1)/len; // linear fade
              ctx.drawImage(rC, p.histX[k], p.histY[k], rCW, rCH);
            }
            ctx.globalAlpha = gA;
            ctx.drawImage(rC, p.x, p.y, rCW, rCH); // current position
          }
        }
      }
      ctx.restore();
    });
  };

  sz.fireworks.rmFlower = function(id) {
    var fw = sz.fireworks;
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
  };

  // Object that displays rocket launch and travel.
  // Triggers a 'flower' (burst) at end of path.
  sz.fireworks.Fly = function(idx) {
    this.flyId = idx;
    this.animate = true;
    this._reset();
  };

  // object that displays burst effect
  sz.fireworks.Flower = function(pointX, pointY, colorIdx, id) {
    this.animate = true;
    this.id = id;
    this.startX = pointX;
    this.startY = pointY;
    this.colorIdx = colorIdx;
    this.particles = []; // x,y coords of each particle
    this.typeIdx = 0;
    this.hypeIdx = 0;
    this._remove = false;
    this.makeRefCanvas();
    this._init();
  };

  sz.fireworks.Flower.prototype.types = [ // adjustments to angle
    function(time,axis,angle) { // standard firework (circular)
      if( axis === 'y' ) {
        return Math.sin(angle);
      }
      else {
        return Math.cos(angle);
      }
    },
    function(time,axis,angle) { // spin
      if( axis === 'y' ) {
        return Math.sin(angle+(time*Math.PI/180/15));
      }
      else {
        return Math.cos(angle+(time*Math.PI/180/15));
      }
    },
    function(time,axis,angle) { // opposite spin
      if( axis === 'y' ) {
        return Math.sin(angle-(time*Math.PI/180/15));
      }
      else {
        return Math.cos(angle-(time*Math.PI/180/15));
      }
    },
    function(time,axis,angle) { // oval
      if( axis === 'y' ) {
        return Math.sin(angle - Math.sin((time/500)/(2*Math.PI)));
      }
      else {
        return Math.cos(angle + Math.sin((time/500)/(2*Math.PI)));
      }
    },
    function(time,axis,angle) { // mirror oval
      if( axis === 'y' ) {
        return Math.sin(angle + Math.sin((time/500)/(2*Math.PI)));
      }
      else {
        return Math.cos(angle - Math.sin((time/500)/(2*Math.PI)));
      }
    },
    function(time,axis,angle) { // wobble
      if( axis === 'y' ) {
        return Math.sin(angle - time/500);
      }
      else {
        return Math.cos(angle + time/500);
      }
    }
  ];

  sz.fireworks.Flower.prototype.hypes = [ // adjustments to hypotenuse
    function(func,time) { return 0; }, // none
    function(func,time) { // bouncy
      return 10*func(time*Math.PI/180*Math.PI/6);
    },
    function(func,time) { // bouncy - reverse
      return -10*func(time*Math.PI/180*Math.PI/6);
    }
  ];

  // set random values, number of particles, speed, duration
  sz.fireworks.Flower.prototype._init = function() {
    var gRI = sz.getRandomInt,
        fw = sz.fireworks,
        numParticles = gRI(fw._MIN_PARTICLES, fw._MAX_PARTICLES);

    this.speed = gRI(fw._MIN_BLOOM_SPEED, fw._MAX_BLOOM_SPEED);
    this.dissolveTime = gRI(fw._MIN_DISSOLVE_SPEED, fw._MAX_DISSOLVE_SPEED);

    this._timeAdjust = 0;
    
    for(var i = 0;i < numParticles;i++) {
      this.particles[i] = {
        x: this.startX,
        y: this.startY,
        histX: [], // stored previous x coords
        histY: [] // stored previous y coords
      };
    }

    var typeRnd = gRI(0,100);
    if( typeRnd < 30 ) {
      this.typeIdx = 0;
    }
    else if( typeRnd < 40 ) {
      this.typeIdx = 1;
    }
    else if( typeRnd < 50 ) {
      this.typeIdx = 2;
    }
    else if( typeRnd < 75 ) {
      this.typeIdx = 3;
    }
    else if( typeRnd < 90 ) {
      this.typeIdx = 4;
    }
    else {
      this.typeIdx = 5;
    }

    hypeRnd = gRI(0,100); //this.hypes.length);
    if( hypeRnd < 80 ) {
      this.hypeIdx = 0;
    }
    else if( hypeRnd < 90 ) {
      this.hypeIdx = 1;
    }
    else {
      this.hypeIdx = 2;
    }

    this.startTime = (new Date()).getTime();
    this.time = null;
  };

  // calculate new values for movement in animation frame
  sz.fireworks.Flower.prototype._animation = function(ctx) {
    var i, j, part,
      fw = sz.fireworks;

    if( this.animate ) {
      var len = this.particles.length;
      this.time = (new Date()).getTime() - this.startTime - this._timeAdjust;

      if( this.time >= this.dissolveTime ) {
        this._remove = true;

        return;
      }

      for(i = 0;i < len;i++) {
        part = this.particles[i];

        var angle = 2*Math.PI/len * i; // 2pi * ratio of index/number of particles
            hypLen = this.speed * this.time / 1000; // distance = speed*time in seconds

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

        yType = this.types[this.typeIdx](this.time,"y",angle);
        xType = this.types[this.typeIdx](this.time,"x",angle);
        hypAdj = this.hypes[this.hypeIdx];
        // vertical movement adjusted to suggest effect of gravity
        part.y = this.startY -
          yType * (hypLen - hypAdj(Math.sin,this.time)) +
          2*(0.0098*3.5*this.time);

        // horizontal movement adjusted to suggest effect of drag
        part.x = this.startX +
          xType * ((hypLen + hypAdj(Math.cos,this.time)) -
          Math.pow(0.000125*3.5*this.time,2));
      }
    }
  };

  sz.fireworks.Flower.prototype.shapeFuncs = [
    function(ctx, that) { // filled circle
      var fw = sz.fireworks,
        x = Math.floor(ctx.canvas.width/2),
        y = Math.floor(ctx.canvas.height/2),
        size = fw._SIZE;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2*Math.PI, false);
      ctx.closePath();
      ctx.fill();
    },
    function(ctx, that) {
      var fw = sz.fireworks,
        center = Math.floor(ctx.canvas.width/2);

      var x = center - fw._SIZE;
      var y = x;
      var width = fw._SIZE*2;
      var height = width;

      ctx.translate(center,center);
      ctx.rotate(Math.PI/180*45);
      ctx.translate(-1*center,-1*center);

      ctx.strokeRect(x,y,width,height);
    },
    function(ctx, that) { // star
      var fw = sz.fireworks;
      var center = Math.floor(ctx.canvas.width/2);
      var x = center,
        y = center - fw._SIZE*2;
      ctx.beginPath();
      ctx.moveTo(x,y); // tip 1

      x = center + Math.max(1,fw._SIZE-1);
      y = center - Math.max(1,fw._SIZE-1);
      ctx.lineTo(x,y); // inflection 1

      x = center + fw._SIZE*2;
      y = center;
      ctx.lineTo(x,y); // tip 2

      x = center + Math.max(1,fw._SIZE-1);
      y = center + Math.max(1,fw._SIZE-1);
      ctx.lineTo(x,y); // inflection 2

      x = center + fw._SIZE*2;
      y = center + fw._SIZE*2;
      ctx.lineTo(x,y); // tip 3

      x = center;
      y = center + Math.max(1,fw._SIZE);
      ctx.lineTo(x,y); // inflection 3

      x = center - fw._SIZE*2;
      y = center + fw._SIZE*2;
      ctx.lineTo(x,y); // tip 4

      x = center - Math.max(1,fw._SIZE-1);
      y = center + Math.max(1,fw._SIZE-1);
      ctx.lineTo(x,y); // inflection 4

      x = center - fw._SIZE*2;
      y = center;
      ctx.lineTo(x,y); // tip 5

      x = center - Math.max(1,fw._SIZE-1);
      y = center - Math.max(1,fw._SIZE-1);
      ctx.lineTo(x,y); // inflection 5

      x = center;
      y = center - fw._SIZE*2;
      ctx.lineTo(x,y); // tip 1

      ctx.closePath();
      ctx.stroke();
    }
  ];

  sz.fireworks.Flower.prototype.makeRefCanvas = function() {
    var fw = sz.fireworks,
        size = 8;
    var refCnvs = new sz.Canvas({
        'width': fw._SIZE*size,
        'height': fw._SIZE*size,
        'cssWidth': (fw._SIZE*size) + 'px',
        'cssHeight': (fw._SIZE*size) + 'px',
      }),
      that = this;

      refCnvs.render(function(ctx) {
        var fw = sz.fireworks,
          color = 'rgba(' + fw._colors[that.colorIdx] + '0.9)',
          shdwColor = 'white',
          size = 8;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.shadowColor = shdwColor;
        ctx.shadowBlur = fw._SIZE*(size-4);
        ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

        var shapeIdx = sz.getRandomInt(0,that.shapeFuncs.length);

        that.shapeFuncs[shapeIdx](ctx, that);

        ctx.restore();
      });

    this.refCanvas = refCnvs;
    return refCnvs;
  };

  // calculate new starting values once an animation sequence is complete
  sz.fireworks.Fly.prototype._reset = function() {
    var gRI = sz.getRandomInt;
    var fw = sz.fireworks,
      canvasHeight = fw.mainCanvas.height();

    this._timeAdjust = 0;

    this.x = this.startX = gRI(100, fw.mainCanvas.width() - 100);
    this.y = this.startY = canvasHeight;

    this.colorIdx = gRI(0, fw._colors.length);
    this.speed = gRI(fw._MIN_SPEED, fw._MAX_SPEED);
    this.angle = gRI(fw._MIN_ANGLE, fw._MAX_ANGLE); // within several degrees of 90
    this.flickerSpeed = gRI(fw._MIN_FLICKER_SPEED, fw._MAX_FLICKER_SPEED);
    this.burstHeight = this.startY - Math.floor(canvasHeight * 
      gRI(fw._MIN_BURST_HEIGHT, fw._MAX_BURST_HEIGHT)/100
    );

    try {
      this.xCoefficient = sz.linearMotionX(this.angle, this.speed);
    } catch (e) {
      if(e instanceof sz.exceptions.SZArgRequiredError) {
        // this should never happen
        this.speed = fw._MIN_SPEED + 10; // force speed to be defined and non-zero
        this.xCoefficient = sz.linearMotionX(this.angle, this.speed);
      }
      else {
        throw e;
      }
    }

    this.startTime = (new Date()).getTime();
    this.time = null;
  };

  // calculate new position for animation frame
  sz.fireworks.Fly.prototype._animation = function(ctx) {
    if( this.animate ) {

      this.time = (new Date()).getTime() - this.startTime -
        this._timeAdjust;
      var new_y = this.startY - this.speed * this.time / 1000,
        new_x = this.x;
//      new_x = this.x + (this.xCoefficient*(this.time/1000));

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
  sz.fireworks.Fly.prototype._burst = function() {
    var flw = sz.fireworks._flowers;

    flw.push(new sz.fireworks.Flower(this.x-1, this.y,
      this.colorIdx, this.flyId + '-' + (new Date().getTime())));
  };

  // draw rectangle to represent rocket
  sz.fireworks.Fly.prototype._redraw = function(ctx) {
    var alpha = sz.getAlpha(this.time, this.flickerSpeed),
      fw = sz.fireworks;

    ctx.save();
    ctx.fillStyle = 'rgba(' + fw._colors[this.colorIdx] + alpha + ')';
    ctx.fillRect(this.x, this.y, fw._SIZE, 2*fw._SIZE);
    ctx.restore();
  };

  // callable function to begin animation
  sz.fireworks.Fly.prototype.startAnimation = function() {
      this.animate = true;
  };

  // callable function that will freeze animation after
  // current frame
  sz.fireworks.Fly.prototype.stopAnimation = function() {
    this.animate = false;
  };

  try {
    sz.setAvailable("fireworks");
  } catch (e) {
    if(e instanceof sz._exceptions.SZAvailableError) {
      return; // assume (perhaps dangerously) existing property is this
    }

    throw e;
  }

  window._93f15a424f3b4388be789d482e982346 = sz;
})(window);
