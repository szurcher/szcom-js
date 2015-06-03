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

  /* sz.Canvas - Wrapper for canvas element using jQuery. By default creates a
   *  new, unattached canvas the same dimensions as the current document as
   *  well as a clone of the created canvas for use as a buffer.
   *
   *  Takes an associative array of options as the only argument. 
   *  Valid options are:
   *    width - canvas element coordinates width (numeric in pixels)
   *    height - canvas element coordinates height (numeric in pixels)
   *    cssWidth - canvas element display width (string, e.g. '300px')
   *    cssHeight - canvas element display height (string), e.g. '50px')
   *    parent - element identifier to use when attaching canvas to doc */
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

  /* sz.Canvas : _init - Initialization helper function */
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

  /* sz.Canvas : width - Getter for canvas width.
   *  Options:
   *    css - any value, if a value is passed the cssWidth is returned. Else
   *      the canvas coordinate width is returned. */
  _sz.Canvas.prototype.width = function(css) {
    if( css === undefined ) {
      return this._canvas.get(0).width;
    }

    return this._canvas.css('width');
  };

  /* sz.Canvas : height - Getter for canvas height.
   *  Options:
   *    css - any value, if a value is passed the cssHeight is returned. Else
   *      the canvas coordinate height is returned. */
  _sz.Canvas.prototype.height = function(css) {
    if( css === undefined ) {
      return this._canvas.get(0).height;
    }

    return this._canvas.css('height');
  };

  /* sz.Canvas : css - Pass-through accessor for jQuery css method of canvas
   *  element. */
  _sz.Canvas.prototype.css = function(opts) {
    return this._canvas.css(opts);
  };

  /* sz.Canvas : attach - Attach canvas element to 'parent' element that must
   *  already exist in the document. 'parent' is set as an option when
   *  a Canvas object is created, defaults to 'body'. */
  _sz.Canvas.prototype.attach = function() {
    this._canvas.appendTo(this._opts.parent);
  };

  /* sz.Canvas : get2DContext - Pass-through accessor for getContext('2d')
   *  method */
  _sz.Canvas.prototype.get2DContext = function() {
    return this._canvas.get(0).getContext('2d');
  };

  // based on the wonderful code at
  // http://kaioa.com/node/103
  /* sz.Canvas : render - Double-buffered canvas draw/paint function.
   *  Takes a function callback as its only argument (required).
   *  Callback function should be of the form:
   *    func(context) { ... }
   *  where context will be the passed in 2d context of the canvas */
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

  /* sz.Canvas : animate - Animation loop function.
   *  Takes a function callback as its only argument (required).
   *  Callback function should be of the form:
   *    func() { ... }
   *  and should contain necessary code to update values for each animation
   *  frame */
  _sz.Canvas.prototype.animate = function(animFunc) {
    var that = this;
    requestAnimFrame(function() {
      that.animate(animFunc);
    });
    animFunc();
  };

  window.sz = _sz;
})(window);
