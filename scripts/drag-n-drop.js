var H5P = H5P || {};

/**
 * A class that easily helps your create awesome drag and drop.
 *
 * @param {object} containerOffset
 * @returns {undefined}
 */
H5P.DragNDrop = function (containerOffset) {
  this.moveThreshold = 4;
  this.containerOffset = containerOffset;
  
  if (H5P.$body === undefined) {
    H5P.$body = H5P.jQuery('body');
  }
};

/**
 * Start tracking the mouse.
 * 
 * @param {jQuery} $element
 * @param {int} x Start X coordinate
 * @param {int} y Start Y coordinate
 * @returns {undefined}
 */
H5P.DragNDrop.prototype.press = function ($element, x, y) {
  var eventData = {
    instance: this
  };
  
  H5P.$body.attr('unselectable', 'on').mouseup(eventData, H5P.DragNDrop.release).bind('mouseleave', eventData, H5P.DragNDrop.release).css({'-moz-user-select': 'none', '-webkit-user-select': 'none', 'user-select': 'none', '-ms-user-select': 'none'}).mousemove(eventData, H5P.DragNDrop.move)[0].onselectstart = function () {
    return false;
  };
  
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
 * @param {object} event
 * @returns {undefined}
 */
H5P.DragNDrop.move = function (event) {
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
  that.$element.css({left: x - that.containerOffset.left, top: y - that.containerOffset.top});
  
  if (that.moveCallback !== undefined) {
    that.moveCallback(x, y);
  }
};

/**
 * Stop tracking the mouse.
 * 
 * @param {object} event
 * @returns {undefined}
 */
H5P.DragNDrop.release = function (event) {
  var that = event.data.instance;
  
  H5P.$body.unbind('mousemove', H5P.DragNDrop.move).unbind('mouseup', H5P.DragNDrop.release).removeAttr('style')[0].onselectstart = null;
    
  if (that.moving) {
    that.$element.removeClass('h5p-moving');
    if (that.stopMovingCallback !== undefined) {
      that.stopMovingCallback();
    };
  }
};