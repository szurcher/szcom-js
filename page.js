(function( $ ) {
  var csrfToken = $.cookie('csrftoken');

  function csrfSafeMethod(method) {
    // HTTPD methods that do not require a CSRF token header
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  $.ajaxSetup({
    crossDomain: false, // prevent cross domain requests
    beforeSend: function(xhr, settings) {
      if( !csrfSafeMethod(settings.type)) {
        xhr.setRequestHeader("X-CSRFToken", csrfToken);
      }
    },
    jsonp: null,
    jsonpCallback: null
  });

  $(document).ready(function() {
    // activate tooltip.js on rel=tooltip
    $('[data-smz-tooltip=show]').tooltip();

    // handle disabled class on links
    $('body').on('click', 'a.disabled', function(event) {
      event.preventDefault();
    });

    // handle nav image toggle
    $('button.navbar-toggle').on("click", function() {
      if( $('.navbar-collapse').hasClass('collapse') ) { 
        $(this)
          .children('span.glyphicon')
          .addClass('glyphicon-chevron-up')
          .removeClass('glyphicon-chevron-down');
      }
      else {
        $(this)
          .children('span.glyphicon')
          .addClass('glyphicon-chevron-down')
          .removeClass('glyphicon-chevron-up');
      }
    });

    // check for links that have a position:
    // relative but no top/left attribute (or have auto)
    $('a[href], #email-button').not(function(idx) {
      var $this = $(this);
      var top = $this.css('top');
      var left = $this.css('left');
      var bottom = $this.css('bottom');
      var right = $this.css('right');
      var pos = $this.css('position');

      return (pos.length > 0 && pos == 'relative') &&
        ((top.length > 0 && top != 'auto') ||
        (bottom.length > 0 && bottom != 'auto')) &&
        ((left.length > 0 && left != 'auto') ||
        (right.length > 0 && right != 'auto'));
    }).css({
      'top': '0',
      'left': '0'
    });

    // set links with an href to position relative if they don't
    // have a position specified
    $('a[href], #email-button').not(function(idx) {
      var pos = $(this).css('position');
      return pos.length > 0 && pos != 'static';
    }).css({
      'position': 'relative',
      'top': '0',
      'left': '0'
    });

    // then make sure they are accessible above any canvas masks
//    $('a[href], #email-button').css('z-index', 99999);
    $('nav').css('z-index', 999999);

    // handle contact form submit
    $('#contact').submit(function(event) {
      event.preventDefault();

      $('#contact .modal-footer button[type="submit"]').attr(
        'disabled', 'disabled'
      );
      $('#form-processing').show();

      $.ajax({
        type: "POST",
        url: "http://" + location.host + "/ajax/send/",
        data: $(this).serialize(),
        dataType: "json"
      })
       .done(function(result, textStatus, jqXHR) {
         $('#contact .modal-footer button[type="submit"]')
           .removeAttr('disabled');
         $('#form-processing').hide();
         // handle success
         $('#contact-modal').modal('hide');
         if( parseInt(result.result, 10) === 0 ) {
          $('<div>')
            .addClass('alert')
            .addClass('alert-danger')
            .addClass('send-error')
            .append('<button type="button" class="close"' +
                    'data-dismiss="alert">x</button>')
            .append('<i class="fa fa-exclamation-circle"></i> ' +
                    'An error occurred while attempting to send the contact' +
                    ' message. Please try again or contact me through' +
                    ' LinkedIn. I apologize for the trouble.')
            .prependTo('#messages');
         }
         else {
          $('<div>')
            .addClass('alert')
            .addClass('alert-success')
            .addClass('send-info')
            .append('<button type="button" class="close"' +
                    'data-dismiss="alert">x</button>')
            .append('<i class="fa fa-info-circle"></i> E-mail sent ' +
                    'successfully! Thank you for contacting me.')
            .prependTo('#messages');
         }
       })
       .fail(function(jqXHR, textStatus, errorThrown) {
         $('#contact .modal-footer button[type="submit"]')
           .removeAttr('disabled');
         $('#form-processing').hide();
         // handle error
         $('#contact-modal').modal('hide');
         $('<div>')
           .addClass('alert')
           .addClass('alert-danger')
           .addClass('send-error')
           .append('<button type="button" class="close"' +
                   'data-dismiss="alert">x</button>')
           .append('<i class="fa fa-exclamation-circle"></i> An error ' +
                   'occurred while communicating with the server.' +
                   ' The server provided the following information:<br>' +
                   textStatus + ', ' + jqXHR.responseText);
       });

      return false;
    });

  });

  $(window).load(function () {
    // equal height rboxes
    var boxes = $('#info .rbox');
    var box_max = -1;
    boxes.each( function () {
      var h = $(this).outerHeight();
      if( h > box_max ) {
        box_max = h;
      }
    }).each( function () {
      $(this).animate({ 'min-height': box_max }, 700);
    });
  });
})( jQuery );
