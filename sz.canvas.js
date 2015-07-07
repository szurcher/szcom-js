/*"""
sz.canvas.js
============

Author: Stephen Zurcher <stephen.zurcher@gmail.com>
License: BSD 2-Clause - http://opensource.org/licenses/BSD-2-Clause

*/

(function(window, undefined) {
  var errMsg = "sz.canvas.js requires sz.js to function. Load sz.js " +
    "before loading sz.canvas.js";
  if( window._93f15a424f3b4388be789d482e982346 === undefined ) {
    throw new Error(errMsg);
  }

  // alias
  var sz = window._93f15a424f3b4388be789d482e982346;

  if( !(sz.hasOwnProperty("uuid")) || sz.uuid !==
    "93f15a42-4f3b-4388-be78-9d482e982346" ) {
    throw new Error(errMsg);
  }

/*"""
.. function:: sz.Canvas(options)

  :param options: Associative array of passed in options

Wrapper for canvas element using jQuery. By default creates a
new, unattached canvas the same dimensions as the current document as
well as a clone of the created canvas for use as a buffer.

Takes an associative array of options as the only argument. 
Valid options are:
  width - canvas element coordinates width (numeric in pixels)
  height - canvas element coordinates height (numeric in pixels)
  cssWidth - canvas element display width (string, e.g. '300px')
  cssHeight - canvas element display height (string), e.g. '50px')
  parent - element identifier to use when attaching canvas to doc
*/

  sz.Canvas = function(opts) {
    var $doc = jQuery('document');
    this._opts = {
      'width': $doc.width(),
      'height': $doc.height(),
      'cssWidth': $doc.css('width'),
      'cssHeight': $doc.css('height'),
      'parent': 'body',
      'szParent': 'body',
      'runAnimation': false
    };
    this._canvas = null;

    this._animReqId = false;

    if( opts !== undefined ) {
      jQuery.extend(this._opts, opts);
    }

    this._init();
  };

  /* sz.Canvas : _init - Initialization helper function */
  sz.Canvas.prototype._init = function() {
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
  sz.Canvas.prototype.width = function(css) {
    if( css === undefined ) {
      return this._canvas.get(0).width;
    }

    return this._canvas.css('width');
  };

  /* sz.Canvas : height - Getter for canvas height.
   *  Options:
   *    css - any value, if a value is passed the cssHeight is returned. Else
   *      the canvas coordinate height is returned. */
  sz.Canvas.prototype.height = function(css) {
    if( css === undefined ) {
      return this._canvas.get(0).height;
    }

    return this._canvas.css('height');
  };

  /* sz.Canvas : css - Pass-through accessor for jQuery css method of canvas
   *  element. */
  sz.Canvas.prototype.css = function(opts) {
    return this._canvas.css(opts);
  };

  /* sz.Canvas : attach - Attach canvas element to 'parent' element that must
   *  already exist in the document. 'parent' is set as an option when
   *  a Canvas object is created, defaults to 'body'.
   *
   *  Returns the canvas object for call chaining */
  sz.Canvas.prototype.attach = function() {
    this._canvas.appendTo(this._opts.parent);
    return this;
  };

  sz.Canvas.prototype.remove = function() {
    this._canvas.remove();
    return this;
  };

  /* sz.Canvas : get2DContext - Pass-through accessor for getContext('2d')
   *  method */
  sz.Canvas.prototype.get2DContext = function() {
    return this._canvas.get(0).getContext('2d');
  };

  // based on the wonderful code at
  // http://kaioa.com/node/103
  /* sz.Canvas : render - Double-buffered canvas draw/paint function.
   *  Takes a function callback as its only argument (required).
   *  Callback function should be of the form:
   *    func(context) { ... }
   *  where context will be the passed in 2d context of the canvas */
  sz.Canvas.prototype.render = function(renderFunc) {
    var context = this.get2DContext(),
      buf = this._buffer.get(0);

    renderFunc(buf.getContext('2d'));

    context.save();
    context.globalCompositeOperation = 'copy';
    context.drawImage(buf, 0, 0);
    context.restore();
  };

  /* sz.Canvas : animate - Animation loop function.
   *  Takes a function callback as its only argument (required).
   *  Callback function should be of the form:
   *    func() { ... }
   *  and should contain necessary code to update values for each animation
   *  frame */
  sz.Canvas.prototype.animate = function(animFunc) {
    var that = this;

    if(this._opts.runAnimation === true) {
      this._animReqId = requestAnimFrame(function() {
        that.animate(animFunc);
      });
      animFunc();
    }
  };

  sz.Canvas.prototype.start = function(animFunc) {
    var that = this;
    this._opts.runAnimation = true;

    if(!this._animReqId) {
      this._animReqId = requestAnimFrame(function() {
        that.animate(animFunc);
      });
      animFunc();
    }
  };

  sz.Canvas.prototype.stop = function() {
    this._opts.runAnimation = false;
    cancelAnimFrame(this._animReqId);
    this._animReqId = false;
  };

  sz.Canvas.prototype.onresize_func = function(event) {
    var o = event.data.canvas._opts,
      szP = jQuery(o.szParent);

    o.width = szP.width();
    o.height = szP.outerHeight();
    o.cssWidth = szP.css('width');
    o.cssHeight = szP.css('height');

    event.data.canvas._canvas
      .width(o.width)
      .height(o.height);

    var rawCanvas = event.data.canvas._canvas.get(0);

    rawCanvas.width = o.width;
    rawCanvas.height = o.height;

    event.data.canvas._canvas
      .css('width', o.cssWidth)
      .css('height', o.cssHeight);

    event.data.canvas._buffer = event.data.canvas._canvas.clone();
  };

  // tag module as loaded
  try {
    sz.setAvailable("canvas");
  } catch (e) {
    if(e instanceof sz._exceptions.SZAvailableError) {
      return; // assume (perhaps dangerously) existing property is this
    }

    throw e;
  }

  // update global object
  window._93f15a424f3b4388be789d482e982346 = sz;
})(window);
