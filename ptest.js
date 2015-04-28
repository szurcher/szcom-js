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

  // make sure getRandomInt exists
  _sz.getRandomInt = _sz.getRandomInt || function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // define ptest
  _sz.ptest = {
    '_MIN_SPEED': 100, // pixels (per second)
    '_MAX_SPEED': 1000,

    'elClass': 'ptest',
    'animObjects': [],

    'animate': null, // animation loop function
    'getBuffer': null, // return buffer canvas object
    'getTmpBuffer': null, // return new canvas object
    'getOrCreateBuffer': null, // return buffer canvas object (create if necc.)
    'renderToCanvas': null, // update canvas with new data
    'Firefly': null // canvas graphic object
  };

  _sz.ptest.animate = function(context) {
    var that = this,  // set up closure for callbacks
        i,
        $buf = this.getBuffer();

    for(i = 0;i < this.animObjects.length;i++) {
      this.animObjects[i]._update();
    }

    if( $buf.length ) {
      context.save();
      context.globalCompositeOperation = 'copy';
      context.drawImage($buf.get(0), 0, 0);
      context.restore();
    }

    // loop
    setTimeout(function() {
      for(var i = 0;i < sz.ptest.animObjects.length;i++) {
        sz.ptest.animObjects[i].startTime += 250; // adjust time for timeout delay
      }
      requestAnimFrame(function() {
        sz.ptest.animate(context);
      });
    }, 250);
  };

  _sz.ptest.getBuffer = function() {
    return jQuery('.' + this.elClass + '.buffer');
  };

  _sz.ptest.getTmpBuffer = function(w,h) {
    var $b = jQuery('body'),
        width = w || $b.width(),
        height = h || $b.height();
    
    $buf = jQuery('<canvas>').width(width).height(height);
    $buf.get(0).width = width;
    $buf.get(0).height = height;
    
    return $buf;
  };

  _sz.ptest.getOrCreateBuffer = function(w,h) {
    var $buf = this.getBuffer();

    if( $buf.length === 0 ) {
      var $b = jQuery('body');

      var width = w || $b.width(),
          height = h || $b.height(),

          cssOpts = {
            'position': 'fixed',
            'left': '-100%',
            'top': '0',
            'z-index': '1'
          };

      $buf = jQuery('<canvas>')
        .addClass('buffer')
        .addClass(this.elClass)
        .appendTo($b)
        .width(width)
        .height(height)
        .css(cssOpts);

      $buf.get(0).width = width;
      $buf.get(0).height = height;
    }
    else if( w !== undefined && h !== undefined ) {
      $buf.width(w);
      $buf.height(h);
      $buf.get(0).width = w;
      $buf.get(0).height = h;
    }

    return $buf;
  };
  
  _sz.ptest.renderToCanvas = function(renderFunction) {
    $buf = this.getOrCreateBuffer();

    if( $buf.length ) {
      renderFunction($buf.get(0).getContext('2d'));
    }
  };

  _sz.ptest.Firefly = function() {
    this.gRI = _sz.getRandomInt;
    this.parent = _sz.ptest;

    this.animate = false;
    this.parent.animObjects.push(this);
    this._init();
  };

  _sz.ptest.Firefly.prototype.flySize = 2;

  _sz.ptest.Firefly.prototype.refContext = (function(func) {
    var size = func.prototype.flySize,
        tmpBuf = _sz.ptest.getTmpBuffer(size*4,size*4);
    tmpBuf = tmpBuf.get(0);
    var tbCtx = tmpBuf.getContext('2d');

    tbCtx.fillStyle = 'red';
//    tbCtx.fillStyle = 'rgb(166,166,255)';
//    tbCtx.fillStyle = 'rgb(160,160,160)';
    tbCtx.shadowColor = tbCtx.fillStyle;
    tbCtx.shadowBlur = size*2;
    tbCtx.shadowOffsetX = tbCtx.shadowOffsetY = 0;
    tbCtx.beginPath();
    tbCtx.arc(size*2, size*2, size, 0, 2*Math.PI, false);
    tbCtx.closePath();
    tbCtx.fill();

    return tbCtx;
  })(_sz.ptest.Firefly);

  _sz.ptest.Firefly.prototype._directions = [
    [-1,0], // left
    [1,0], // right
    [0,-1], // up
    [0,1], // down
    [-1,-1], // diag left up
    [-1,1], // diag left down
    [1,-1], // diag right up
    [1,1] // diag right down
  ];

  _sz.ptest.Firefly.prototype._init = function() {
    var $buf = this.parent.getBuffer();

    if( $buf.length ) {
      this.max_x = $buf.width();
      this.max_y = $buf.height();
      this.x = this.startX = this.old_x = this.gRI(0, this.max_x);
      this.y = this.startY = this.old_y = this.gRI(0, this.max_y);

      this.speed = this.gRI(this.parent._MIN_SPEED, this.parent._MAX_SPEED);
      this.direction = this.gRI(0, this._directions.length - 1);

      this.startTime = Date.now();
      this.time = null;
    }
  };

  _sz.ptest.Firefly.prototype._set_position = function() {
    this.old_x = this.x;
    this.old_y = this.y;
    this.x = this.startX + Math.floor((this.speed * this._directions[this.direction][0]) * (this.time/1000));
    this.y = this.startY + Math.floor((this.speed * this._directions[this.direction][1]) * (this.time / 1000));
  };

  _sz.ptest.Firefly.prototype._update = function() {
    if(this.animate) {
      this.time = Date.now() - this.startTime;

      this._set_position();
      if( this.x > this.max_x || this.x < 0 || this.y > this.max_y || this.y < 0 ) {
        this._init(); // out of bounds, do reset
      }

      this._paint();
    }
  };

  _sz.ptest.Firefly.prototype._paint = function() {
    var that = this;
    this.parent.renderToCanvas(function(ctx) {
      var obj = that;
      var i,
          refWidth = obj.refContext.canvas.width, // stored img width
          refHeight = obj.refContext.canvas.height, // stored img height
          max_steps = 80, // alpha max which also controls iterations
          dir = obj._directions[obj.direction]; // array w/x and y direction indicators

      // if distance moved is less than full length of trail, reduce
      if( obj.x <= Math.abs(obj.startX + (max_steps*dir[0])) &&
          obj.y <= Math.abs(obj.startY + (max_steps*dir[1])) ) {
        max_steps = Math.abs(obj.x - obj.startX);
        var tmp = Math.abs(obj.y - obj.startY);
        if( tmp > max_steps ) { // use greater of the 2 dimensions
          max_steps = tmp;
        }
      }

          // intermediate drawing buffer
      var buf = obj.parent.getTmpBuffer(refWidth+max_steps-1, refHeight+max_steps-1),
          bufContext = buf.get(0).getContext('2d'),
          buf_x = 0, // tmp buffer start x
          buf_y = 0, // tmp buffer start y
          clr_x = obj.old_x, // left-most point in prev rgn
          clr_y = obj.old_y, // top-most point in prev rgn
          draw_x = obj.x, // main buffer left x
          draw_y = obj.y; // main buffer top y

          
      // clear previous region
      if( dir[0] > 0 ) { // if motion is towards the right, adjust left point
        clr_x -= max_steps;
        buf_x = bufContext.canvas.width - refWidth;
      }
      if( dir[1] > 0 ) { // if motion is towards the bottom, adjust top point
        clr_y -= max_steps;
        buf_y = bufContext.canvas.height - refHeight;
      }

      ctx.save();
/*        ctx.clearRect(clr_x, clr_y, bufContext.canvas.width, bufContext.canvas.height);
        bufContext.clearRect(0,0,bufContext.canvas.width,bufContext.canvas.height);
*/
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      bufContext.clearRect(0, 0, bufContext.canvas.width, bufContext.canvas.height);

        if( max_steps > 0 ) {
          var normStep = Math.floor(100/max_steps); // normalized step value for alpha
          for(i = max_steps;i > 0;i--) {
            bufContext.globalAlpha = normStep*i/100; // from most opaque to transparent
            bufContext.drawImage(obj.refContext.canvas, buf_x, buf_y);
            buf_x += -1*dir[0];
            buf_y += -1*dir[1];
          }
        }
        else {
          bufContext.drawImage(obj.refContext.canvas, buf_x, buf_y);
        }
        // copy to main buffer
        ctx.drawImage(buf.get(0), draw_x, draw_y);
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

      var $bg = jQuery('#bg');
      var w = $bg.width(),
          h = $bg.outerHeight(),
          $canvas = jQuery('<canvas>')
                    .addClass(sz.ptest.elClass)
                    .width(w)
                    .height(h)
                    .css({
                      'z-index': '1',
                      'position': 'absolute',
                      'left': '0',
                      'top': $bg.offset().top
                    })
                    .appendTo('body');

      $canvas.get(0).width = w;
      $canvas.get(0).height = h;

      sz.ptest.getOrCreateBuffer(w, h); // init buffer

      var test = new sz.ptest.Firefly();
      sz.ptest.animate($canvas.get(0).getContext('2d'));
    });
  })(jQuery);
})(window);
