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

  _sz.renderToCanvas = function(object, renderFunction) {
    var $buffer = jQuery('canvas.snow.buffer');

    if( $buffer.length ) {
      var buffer = $buffer.get(0);
      renderFunction(object, buffer.getContext('2d'));
    }
  };

  _sz.sinMotion = function(value, height, waveLength) {
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

    initAnimation: function(context) {
      var i = 0;
      if( _sz.snow.snow.length === 0 ) {
        for(i = 0;i < _sz.snow._NUM_OBJECTS;i++) {
          _sz.snow.snow.push(new _sz.snow.SnowDrop());
        }
      }

      var $b = jQuery('body');
      context.clearRect(0, 0, $b.width(), $b.height());

      var $buf = jQuery('canvas.snow.buffer');
      if( !$buf.length ) {
        $buf = jQuery('<canvas>')
                .addClass('buffer')
                .addClass('snow')
                .appendTo($b)
                .width($b.width())
                .height($b.height())
                .css('position', 'fixed')
                .css('left', '-100%')
                .css('top', '-10px')
                .css('z-index', '1');

         $buf.get(0).width = $b.width();
         $buf.get(0).height = $b.height();
      }

      var buf = $buf.get(0);
      var ctx = buf.getContext('2d');
      ctx.clearRect(0, 0, buf.width, buf.height);

      for(i = 0;i < _sz.snow.snow.length;i++) {
        _sz.snow.snow[i]._animation(_sz.sinMotion);
      }

      context.drawImage(buf, 0, 0);
      requestAnimFrame(function() {
        _sz.snow.initAnimation(context);
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

    this.canvas = jQuery('canvas.snow').get(0);

    this.startX = gRI(0, this.canvas.width);
    this.startY = -1 * gRI(0, this.canvas.height);
    this.x = this.startX;
    this.y = this.startY;

    this.speed = gRI(sn._MIN_SPEED, sn._MAX_SPEED);
    this.amplitude = gRI(sn._MIN_AMP, sn._MAX_AMP);
    this.period = gRI(sn._MIN_PERIOD, sn._MAX_PERIOD);
  
    this.radius = gRI(sn._MIN_RADIUS, sn._MAX_RADIUS);
    this.startTime = (new Date()).getTime();
  };

  _sz.snow.SnowDrop.prototype._animation = function(funcMoveX) {
    if(this.animate) {
      var time = (new Date()).getTime() - this.startTime;
      this.y = this.startY + this.speed * time / 1000;

      if( this.amplitude === 0 || this.period === 0 ) {
        this.x = funcMoveX(this.y) + this.startX;
      }
      else {
        this.x = funcMoveX(time, this.amplitude, this.period) + this.startX;
      }

      if( this.y >= document.body.clientHeight ) {
        this._reset();
      }

      this._redraw();
    }
  };

  _sz.snow.SnowDrop.prototype._redraw = function() {
    _sz.renderToCanvas(this, function(object, ctx) {
      ctx.beginPath();
      ctx.arc(object.x, object.y, object.radius, 0, 2*Math.PI,false);
      ctx.closePath();
      ctx.fillStyle = '#fefefe';
      ctx.shadowColor = '#ccc';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fill();
    });
  };

  _sz.snow.SnowDrop.prototype.startAnimation = function() {
    if( !this.animate ) {
      this.animate = true;
      this._animation(_sz.sinMotion);
    }
  };

  _sz.snow.SnowDrop.prototype.stopAnimation = function() {
    this.animate = false;
  };

  window.sz = _sz;

  (function($) {
    var $b = $('body');
    var $c = $('<canvas>')
              .addClass('snow')
              .appendTo($b)
              .width($b.width())
              .height($b.height())
              .css('position', 'fixed')
              .css('left', '0')
              .css('top', '-10px')
/*            .css('pointer-events', 'none')*/
              .css('z-index', '9999');

    var $buf = $('canvas.snow.buffer');

    if( $buf.length === 0 ) {
      $buf = $('<canvas>')
        .addClass('buffer')
        .addClass('snow')
        .appendTo($b)
        .width($b.width())
        .height($b.height())
        .css('position', 'fixed')
        .css('left', '-100%')
        .css('top', '-10px')
        .css('z-index', '1');
    }

    var c = $c.get(0);
    c.width = $b.width();
    c.height = $b.height();

    var buf = $buf.get(0);
    buf.width = $b.width();
    buf.height = $b.height();

    $(window).on('resize', function (eventObject) {
      var $b = $('body');
      var $c = $('canvas.snow:not(.buffer)');
      var $buf = $('canvas.snow.buffer');

      if( $c.length ) {
        $c.width($b.width()).height($b.height());
        $c.get(0).width = $b.width();
        $c.get(0).height = $b.height();
      }

      if( $buf.length ) {
        $buf.width($b.width()).height($b.height());
        $buf.get(0).width = $b.width();
        $buf.get(0).height = $b.height();
      }
    });

//    $(document).ready(function() {
//      _sz.snow.initAnimation(c.getContext('2d'));
//    });
  })(jQuery);
})(window);
