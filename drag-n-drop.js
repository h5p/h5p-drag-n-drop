var H5P = H5P || {};

/**
 * A class that easily helps your create awesome drag and drop.
 *
 * @param {H5P.DragNBar} DnB
 * @param {jQuery} $container
 * @returns {undefined}
 */
H5P.DragNDrop = function (dnb, $container) {
  H5P.EventDispatcher.call(this);
  this.dnb = dnb;
  this.$container = $container;
  this.scrollLeft = 0;
  this.scrollTop = 0;
};

// Inherit support for events
H5P.DragNDrop.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.DragNDrop.prototype.constructor = H5P.DragNDrop;

/**
 * Set the current element
 * 
 * @method setElement
 * @param  {j@uery} $element
 */
H5P.DragNDrop.prototype.setElement = function ($element) {
  this.$element = $element;
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

  H5P.$window
    .mousemove(eventData, H5P.DragNDrop.moveHandler)
    .bind('mouseup', eventData, H5P.DragNDrop.release);

  H5P.$body
    // With user-select: none uncommented, after moving a drag and drop element, if I hover over something that changes transparancy on hover IE10 on WIN7 crashes
    // TODO: Add user-select and -ms-user-select later if IE10 stops bugging
    .css({'-moz-user-select': 'none', '-webkit-user-select': 'none'/*, 'user-select': 'none', '-ms-user-select': 'none'*/})
    .attr('unselectable', 'on')[0]
    .onselectstart = H5P.$body[0].ondragstart = function () {
      return false;
    };

  that.containerOffset = $element.offsetParent().offset();

  this.$element = $element;
  this.moving = false;
  this.startX = x;
  this.startY = y;

  this.containerWidth = this.$container[0].getBoundingClientRect().width;
  this.containerHeight = this.$container[0].getBoundingClientRect().height;

  this.marginX = parseInt($element.css('marginLeft')) + parseInt($element.css('marginRight'));
  this.marginY = parseInt($element.css('marginTop')) + parseInt($element.css('marginBottom'));

  var offset = $element.offset();
  this.adjust = {
    x: x - offset.left + this.marginX,
    y: y - offset.top - this.marginY
  };

  if (that.dnb && that.dnb.newElement) {
    this.move(x, y);
  }
};

/**
 * Handles mouse move events.
 *
 * @param {Event} event
 */
H5P.DragNDrop.moveHandler = function (event) {
  event.stopPropagation();
  event.data.instance.move(event.pageX, event.pageY);
};

/**
 * Handles mouse movements.
 *
 * @param {number} x
 * @param {number} y
 */
H5P.DragNDrop.prototype.move = function (x, y) {
  var that = this;

  let angle;
  let setAngle = false;

  // Finding angle on element in the css-transform
  if(!setAngle) {
    const styleElement = window.getComputedStyle(that.$element[0]);
    const matrix = styleElement.getPropertyValue("transform");
    if (matrix !== "none") {
      const values = matrix.split("(")[1].split(")")[0].split(",");
      const a = values[0];
      const b = values[1];
      angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }
    setAngle = true;
  }

  // Finding corner positions to ensure the element is never outside the container borders
  // *************************************************************************************
  const theElement = that.$element[0];

  let left;
  let top;
  let width;
  let height;
  
  // When scaling the element by dragging on the 'dots', the transform-value is changing, not left and top, as it is when 'moving'/'dragging' the element.
  // So we find the values 'translate x and y' and add them to left and top.
  const transformCSSTranslateXYArray = theElement.style.transform.split("px");
  const transformCSSTranslateX = (parseInt(transformCSSTranslateXYArray[0].match(/-?\d+/g)));
  const transformCSSTranslateY = (parseInt(transformCSSTranslateXYArray[1].match(/-?\d+/g)));

  if(theElement.style.left.includes("%")) {
    left = this.containerWidth * parseInt(theElement.style.left) / 100 + transformCSSTranslateX;
  } else {
    left = parseInt(theElement.style.left) + transformCSSTranslateX;
  }
  if(theElement.style.top.includes("%")) {
    top = this.containerHeight * parseInt(theElement.style.top) / 100 + transformCSSTranslateY;
  } else {
    top = parseInt(theElement.style.top) + transformCSSTranslateY;
  }
  if(theElement.style.width.includes("%")) {
    width = this.containerWidth * parseInt(theElement.style.width) / 100;
  } else {
    width = parseInt(theElement.style.width)
  }
  if(theElement.style.height.includes("%")) {
    height = this.containerHeight * parseInt(theElement.style.height) / 100;
  } else {
    height = parseInt(theElement.style.height)
  }
  
  let origin = [left + 0.5 * width, top + 0.5 * height];

  const topRightCorner0DegreesPos = [origin[0] + 0.5 * width, origin[1] - 0.5 * height];
  const topLeftCorner0DegreesPos = [origin[0] - 0.5 * width, origin[1] - 0.5 * height];
  
  const angleTopRight0Degrees = Math.atan2(origin[1] - topRightCorner0DegreesPos[1], topRightCorner0DegreesPos[0] - origin[0]) * 180 / Math.PI;
  const angleTopLeft0Degrees = Math.atan2(origin[1] - topLeftCorner0DegreesPos[1], topLeftCorner0DegreesPos[0] - origin[0]) * 180 / Math.PI;
  const angleBottomRight0Degrees = -angleTopRight0Degrees;
  const angleBottomLeft0Degrees = -angleTopLeft0Degrees;

  const hypToCorners = Math.sqrt(Math.pow((width/2),2) + Math.pow((height/2),2));

  const newPosTopRightCorner = this.findNewPoint(origin[0], origin[1], (angleTopRight0Degrees - angle), hypToCorners);
  const newPosTopleftCorner = this.findNewPoint(origin[0], origin[1], (angleTopLeft0Degrees - angle), hypToCorners);
  const newPosBottomRightCorner = this.findNewPoint(origin[0], origin[1], (angleBottomRight0Degrees - angle), hypToCorners);
  const newPosBottomLeftCorner = this.findNewPoint(origin[0], origin[1], (angleBottomLeft0Degrees - angle), hypToCorners);

  const rightmostPoint = Math.max(newPosTopRightCorner[0], newPosTopleftCorner[0], newPosBottomLeftCorner[0], newPosBottomRightCorner[0]);
  const rightmostPointAdjust = rightmostPoint - (left + width);
  const leftmostPoint = Math.min(newPosTopRightCorner[0], newPosTopleftCorner[0], newPosBottomLeftCorner[0], newPosBottomRightCorner[0]);
  const leftmostPointAdjust = left - leftmostPoint;
  const topmostPoint = Math.min(newPosTopRightCorner[1], newPosTopleftCorner[1], newPosBottomLeftCorner[1], newPosBottomRightCorner[1]);
  const topmostPointAdjust = top - topmostPoint;
  const bottommostPoint = Math.max(newPosTopRightCorner[1], newPosTopleftCorner[1], newPosBottomLeftCorner[1], newPosBottomRightCorner[1]);
  const bottommostPointAdjust = bottommostPoint - (top + height);
  // Done finding corner positions
  // ***********************************************************************************

  if (!that.moving) {
    if (that.startMovingCallback !== undefined && !that.startMovingCallback(x, y)) {
      return;
    }

    // Start moving
    that.moving = true;
    that.$element.addClass('h5p-moving');
  }

  x -= that.adjust.x;
  y -= that.adjust.y;

  var posX = x - that.containerOffset.left + that.scrollLeft;
  var posY = y - that.containerOffset.top + that.scrollTop;

  if (that.snap !== undefined) {
    posX = Math.round(posX / that.snap) * that.snap;
    posY = Math.round(posY / that.snap) * that.snap;
  }

  // Do not move outside of minimum values.
  // Adjusted values are added when the element is rotated.
  if (that.min !== undefined) {
    if ((posX - leftmostPointAdjust) < that.min.x) {
      posX = that.min.x + leftmostPointAdjust;
      x = that.min.x + that.containerOffset.left - that.scrollLeft;
    }
    if (posY - topmostPointAdjust < that.min.y) {
      posY = that.min.y + topmostPointAdjust;
      y = that.min.y + that.containerOffset.top - that.scrollTop;
    }
  }
  if (that.dnb && that.dnb.newElement && posY >= 0) {
    that.min.y = 0;
  }

  // Do not move outside of maximum values.
  if (that.max !== undefined) {
    if ((posX + width + rightmostPointAdjust) > (that.max.x + width)) {
      posX = that.max.x - rightmostPointAdjust;
      x = that.max.x + that.containerOffset.left - that.scrollLeft;
    }
    if (posY + height + bottommostPointAdjust > (that.max.y + height)) {
      posY = that.max.y - bottommostPointAdjust;
      y = that.max.y + that.containerOffset.top - that.scrollTop;
    }
  }

  // Show transform panel if element has moved
  var startX = that.startX - that.adjust.x - that.containerOffset.left + that.scrollLeft;
  var startY = that.startY - that.adjust.y - that.containerOffset.top + that.scrollTop;
  if (!that.snap && (posX !== startX || posY !== startY)) {
    that.trigger('showTransformPanel');
  }
  else if (that.snap) {
    var xChanged = (Math.round(posX / that.snap) * that.snap) !==
      (Math.round(startX / that.snap) * that.snap);
    var yChanged = (Math.round(posY / that.snap) * that.snap) !==
      (Math.round(startY / that.snap) * that.snap);
    if (xChanged || yChanged) {
      that.trigger('showTransformPanel');
    }
  }

  // Moving the element to the calculated position
  that.$element.css({left: posX - transformCSSTranslateX, top: posY - transformCSSTranslateY});

  if (that.dnb) {
    that.dnb.updateCoordinates();
  }

  if (that.moveCallback !== undefined) {
    that.moveCallback(x, y, that.$element);
  }
};

// Find position relative to origin by knowing origin, angle and distance
H5P.DragNDrop.prototype.findNewPoint = function (originX, originY, angle, distance) {
  
  let result = [];
  result.push(Math.cos(angle * Math.PI / 180) * distance + originX);
  result.push(-Math.sin(angle * Math.PI / 180) * distance + originY);

  return result;
}

/**
 * Stop tracking the mouse.
 *
 * @param {Object} event
 * @returns {undefined}
 */
H5P.DragNDrop.release = function (event) {
  var that = event.data.instance;

  H5P.$window
    .unbind('mousemove', H5P.DragNDrop.moveHandler)
    .unbind('mouseup', H5P.DragNDrop.release);

  H5P.$body
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
    }
  }

  // trigger to hide the transform panel unless it was activated
  // through the context menu
  that.trigger('hideTransformPanel');
};
