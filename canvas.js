/** canvas.js ***********************************************************
 *
 * Author: Stephen Zurcher <stephen.zurcher@gmail.com>
 * License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause
 *
 ************************************************************************/
(function(window, undefined) {
  // load namespace or create it
  var _sz = window.sz || {};

  // make sure getRandomInt exists
  _sz.getRandomInt = _sz.getRandomInt || function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // shim requestAnimFrame
  window.requestAnimFrame = window.requestAnimFrame || (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimetout(callback, 1000/60);
      };
  })();

  _sz.Canvas = function(opts) {
    var $doc = jQuery('document');
    this._opts = {
      'width': $doc.width(),
      'height': $doc.height(),
      'cssWidth': $doc.css('width'),
      'cssHeight': $doc.css('height'),
      'parent': 'body'
    };
    this._canvas = null;

    jQuery.extend(this._opts, opts);

    this._init();
  };

  _sz.Canvas.prototype._init = function() {
    if(this._canvas === null) {
      var o = this._opts;

      this._canvas = jQuery('<canvas>')
                    .width(o.width)
                    .height(o.height)
                    .css({
                      'width': o.cssWidth,
                      'height': o.cssHeight
                    });

      this._canvas.get(0).width = o.width;
      this._canvas.get(0).height = o.height;

      this._buffer = this._canvas.clone();
    }
  };

  _sz.Canvas.prototype.width = function(css) {
    if( css === undefined ) {
      return this._canvas.get(0).width;
    }

    return this._canvas.css('width');
  };

  _sz.Canvas.prototype.height = function(css) {
    if( css === undefined ) {
      return this._canvas.get(0).height;
    }

    return this._canvas.css('height');
  };

  _sz.Canvas.prototype.css = function(opts) {
    return this._canvas.css(opts);
  };

  _sz.Canvas.prototype.attach = function() {
    this._canvas.appendTo(this._opts.parent);
  };

  _sz.Canvas.prototype.get2DContext = function() {
    return this._canvas.get(0).getContext('2d');
  };

  // based on the wonderful code at
  // http://kaioa.com/node/103
  _sz.Canvas.prototype.render = function(renderFunc) {
    var context = this.get2DContext();

    renderFunc(this._buffer.get(0).getContext('2d'));

    context.save();
    context.beginPath();
    context.globalCompositeOperation = 'copy';
    context.drawImage(this._buffer.get(0), 0, 0);
    context.closePath();
    context.restore();
  };

  _sz.Canvas.prototype.animate = function(animFunc) {
    var that = this;
    requestAnimFrame(function() {
      that.animate(animFunc);
    });
    animFunc();
  };

  window.sz = _sz;
})(window);
