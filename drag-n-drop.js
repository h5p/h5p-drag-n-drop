var H5P = H5P || {};

/**
 * A class that easily helps your create awesome drag and drop.
 *
 * @param {jQuery} $container
 * @returns {undefined}
 */
H5P.DragNDrop = function ($container) {
  this.moveThreshold = 4;
  this.$container = $container;
  this.scrollLeft = 0;
  this.scrollTop = 0;
  
  // TODO: Use jQuery events instead of callbacks?
};

/**
 * Start tracking the mouse.
 *
 * @param {jQuery} $element
 * @param {Number} x Start X coordinate
 * @param {Number} y Start Y coordinate
 * @returns {undefined}
 */
H5P.DragNDrop.prototype.press = function ($element, x, y) {
  var that = this;
  var eventData = {
    instance: this
  };

  H5P.$body
    .bind('mouseup', eventData, H5P.DragNDrop.release)
    .bind('mouseleave', eventData, H5P.DragNDrop.release)
    // With user-select: none uncommented, after moving a drag and drop element, if I hover over something that changes transparancy on hover IE10 on WIN7 crashes
    // TODO: Add user-select and -ms-user-select later if IE10 stops bugging
    .css({'-moz-user-select': 'none', '-webkit-user-select': 'none'/*, 'user-select': 'none', '-ms-user-select': 'none'*/})
    .mousemove(eventData, H5P.DragNDrop.move)
    .attr('unselectable', 'on')[0]
    .onselectstart = H5P.$body[0].ondragstart = function () {
      return false;
    };

  that.containerOffset = $element.offsetParent().offset();

  this.$element = $element;
  this.moving = false;
  this.startX = x;
  this.startY = y;

  this.marginX = parseInt($element.css('marginLeft')) + parseInt($element.css('marginRight'));
  this.marginY = parseInt($element.css('marginTop')) + parseInt($element.css('marginBottom'));

  var offset = $element.offset();
  this.adjust = {
    x: x - offset.left + this.marginX,
    y: y - offset.top - this.marginY
  };
};

/**
 * Handles mouse movements.
 *
 * @param {Object} event
 * @returns {undefined}
 */
H5P.DragNDrop.move = function (event) {
  event.stopPropagation();
  var that = event.data.instance;

  if (!that.moving) {
    if (event.pageX > that.startX + that.moveThreshold || event.pageX < that.startX - that.moveThreshold || event.pageY > that.startY + that.moveThreshold || event.pageY < that.startY - that.moveThreshold) {
      if (that.startMovingCallback !== undefined && !that.startMovingCallback(event)) {
        return;
      }

      // Start moving
      that.moving = true;
      that.$element.addClass('h5p-moving');
    }
    else {
      return;
    }
  }

  var x = event.pageX - that.adjust.x;
  var y = event.pageY - that.adjust.y;

  var posX = x - that.containerOffset.left + that.scrollLeft;
  var posY = y - that.containerOffset.top + that.scrollTop;
  

  if (that.snap !== undefined) {
    posX = Math.round(posX / that.snap) * that.snap;
    posY = Math.round(posY / that.snap) * that.snap;
  }

  that.$element.css({left: posX, top: posY});

  if (that.moveCallback !== undefined) {
    that.moveCallback(x, y);
  }
};

/**
 * Stop tracking the mouse.
 *
 * @param {Object} event
 * @returns {undefined}
 */
H5P.DragNDrop.release = function (event) {
  var that = event.data.instance;

  H5P.$body
    .unbind('mousemove', H5P.DragNDrop.move)
    .unbind('mouseup', H5P.DragNDrop.release)
    .unbind('mouseleave', H5P.DragNDrop.release)
    .css({'-moz-user-select': '', '-webkit-user-select': ''/*, 'user-select': '', '-ms-user-select': ''*/})
    .removeAttr('unselectable')[0]
    .onselectstart = H5P.$body[0].ondragstart = null;

  if (that.releaseCallback !== undefined) {
    that.releaseCallback();
  }

  if (that.moving) {
    that.$element.removeClass('h5p-moving');
    if (that.stopMovingCallback !== undefined) {
      that.stopMovingCallback(event);
    };
  }
};