// namespaces
var dwv = dwv || {};
dwv.tool = dwv.tool || {};
/**
 * The Konva namespace.
 *
 * @external Konva
 * @see https://konvajs.org/
 */
var Konva = Konva || {};

/**
 * Shape editor.
 *
 * @param {object} app The associated application.
 * @class
 */
dwv.tool.ShapeEditor = function (app) {
  /**
   * Edited shape.
   *
   * @private
   * @type {object}
   */
  var shape = null;
  /**
   * Edited image. Used for quantification update.
   *
   * @private
   * @type {object}
   */
  var image = null;
  /**
   * Active flag.
   *
   * @private
   * @type {boolean}
   */
  var isActive = false;
  /**
   * Update function used by anchors to update the shape.
   *
   * @private
   * @type {Function}
   */
  var updateFunction = null;
  /**
   * Draw event callback.
   *
   * @private
   * @type {Function}
   */
  var drawEventCallback = null;

  /**
   * Set the shape to edit.
   *
   * @param {object} inshape The shape to edit.
   */
  this.setShape = function (inshape) {
    shape = inshape;
    // reset anchors
    if (shape) {
      removeAnchors();
      addAnchors();
    }
  };

  /**
   * Set the associated image.
   *
   * @param {object} img The associated image.
   */
  this.setImage = function (img) {
    image = img;
  };

  /**
   * Get the edited shape.
   *
   * @returns {object} The edited shape.
   */
  this.getShape = function () {
    return shape;
  };

  /**
   * Get the active flag.
   *
   * @returns {boolean} The active flag.
   */
  this.isActive = function () {
    return isActive;
  };

  /**
   * Set the draw event callback.
   *
   * @param {object} callback The callback.
   */
  this.setDrawEventCallback = function (callback) {
    drawEventCallback = callback;
  };

  /**
   * Enable the editor. Redraws the layer.
   */
  this.enable = function () {
    isActive = true;
    if (shape) {
      setAnchorsVisible(true);
      if (shape.getLayer()) {
        shape.getLayer().draw();
      }
    }
  };

  /**
   * Disable the editor. Redraws the layer.
   */
  this.disable = function () {
    isActive = false;
    if (shape) {
      setAnchorsVisible(false);
      if (shape.getLayer()) {
        shape.getLayer().draw();
      }
    }
  };

  /**
   * Reset the anchors.
   */
  this.resetAnchors = function () {
    // remove previous controls
    removeAnchors();
    // add anchors
    addAnchors();
    // set them visible
    setAnchorsVisible(true);
  };

  /**
   * Apply a function on all anchors.
   *
   * @param {object} func A f(shape) function.
   * @private
   */
  function applyFuncToAnchors(func) {
    if (shape && shape.getParent()) {
      var anchors = shape.getParent().find('.anchor');
      anchors.each(func);
    }
  }

  /**
   * Set anchors visibility.
   *
   * @param {boolean} flag The visible flag.
   * @private
   */
  function setAnchorsVisible(flag) {
    applyFuncToAnchors(function (anchor) {
      anchor.visible(flag);
    });
  }

  /**
   * Set anchors active.
   *
   * @param {boolean} flag The active (on/off) flag.
   */
  this.setAnchorsActive = function (flag) {
    var func = null;
    if (flag) {
      func = function (anchor) {
        setAnchorOn(anchor);
      };
    } else {
      func = function (anchor) {
        setAnchorOff(anchor);
      };
    }
    applyFuncToAnchors(func);
  };

  /**
   * Remove anchors.
   *
   * @private
   */
  function removeAnchors() {
    applyFuncToAnchors(function (anchor) {
      anchor.remove();
    });
  }

  /**
   * Add the shape anchors.
   *
   * @private
   */
  function addAnchors() {
    // exit if no shape or no layer
    if (!shape || !shape.getLayer()) {
      return;
    }
    // get shape group
    var group = shape.getParent();
    // add shape specific anchors to the shape group
    if (shape instanceof Konva.Line) {
      var points = shape.points();

      var needsBeginEnd = group.name() === 'line-group' ||
                group.name() === 'ruler-group' ||
                group.name() === 'protractor-group';
      var needsMid = group.name() === 'protractor-group';

      var px = 0;
      var py = 0;
      var name = '';
      for (var i = 0; i < points.length; i = i + 2) {
        px = points[i] + shape.x();
        py = points[i + 1] + shape.y();
        name = i;
        if (needsBeginEnd) {
          if (i === 0) {
            name = 'begin';
          } else if (i === points.length - 2) {
            name = 'end';
          }
        }
        if (needsMid && i === 2) {
          name = 'mid';
        }
        addAnchor(group, px, py, name);
      }

      if (group.name() === 'line-group') {
        updateFunction = dwv.tool.draw.UpdateArrow;
      } else if (group.name() === 'ruler-group') {
        updateFunction = dwv.tool.draw.UpdateRuler;
      } else if (group.name() === 'protractor-group') {
        updateFunction = dwv.tool.draw.UpdateProtractor;
      } else if (group.name() === 'roi-group') {
        updateFunction = dwv.tool.draw.UpdateRoi;
      } else if (group.name() === 'freeHand-group') {
        updateFunction = dwv.tool.draw.UpdateFreeHand;
      } else {
        console.warn('Cannot update unknown line shape.');
      }
    } else if (shape instanceof Konva.Rect) {
      updateFunction = dwv.tool.draw.UpdateRect;
      var rectX = shape.x();
      var rectY = shape.y();
      var rectWidth = shape.width();
      var rectHeight = shape.height();
      addAnchor(group, rectX, rectY, 'topLeft');
      addAnchor(group, rectX + rectWidth, rectY, 'topRight');
      addAnchor(group, rectX + rectWidth, rectY + rectHeight, 'bottomRight');
      addAnchor(group, rectX, rectY + rectHeight, 'bottomLeft');
    } else if (shape instanceof Konva.Ellipse) {
      updateFunction = dwv.tool.draw.UpdateEllipse;
      var ellipseX = shape.x();
      var ellipseY = shape.y();
      var radius = shape.radius();
      addAnchor(group, ellipseX - radius.x, ellipseY - radius.y, 'topLeft');
      addAnchor(group, ellipseX + radius.x, ellipseY - radius.y, 'topRight');
      addAnchor(group, ellipseX + radius.x, ellipseY + radius.y, 'bottomRight');
      addAnchor(group, ellipseX - radius.x, ellipseY + radius.y, 'bottomLeft');
    }
    // add group to layer
    //shape.getLayer().add( group );
    //shape.getParent().add( group );
  }

  /**
   * Create shape editor controls, i.e. the anchors.
   *
   * @param {object} group The group associated with this anchor.
   * @param {number} x The X position of the anchor.
   * @param {number} y The Y position of the anchor.
   * @param {number} id The id of the anchor.
   * @private
   */
  function addAnchor(group, x, y, id) {
    // anchor shape
    var anchor = new Konva.Circle({
      x: x,
      y: y,
      stroke: '#999',
      fill: 'rgba(100,100,100,0.7',
      strokeWidth: app.getStyle().getScaledStrokeWidth() / app.getScale(),
      radius: app.getStyle().scale(6) / app.getScale(),
      name: 'anchor',
      id: id,
      dragOnTop: false,
      draggable: true,
      visible: false
    });
    // set anchor on
    setAnchorOn(anchor);
    // add the anchor to the group
    group.add(anchor);
  }

  /**
   * Get a simple clone of the input anchor.
   *
   * @param {object} anchor The anchor to clone.
   * @returns {object} A clone of the input anchor.
   * @private
   */
  function getClone(anchor) {
    // create closure to properties
    var parent = anchor.getParent();
    var id = anchor.id();
    var x = anchor.x();
    var y = anchor.y();
    // create clone object
    var clone = {};
    clone.getParent = function () {
      return parent;
    };
    clone.id = function () {
      return id;
    };
    clone.x = function () {
      return x;
    };
    clone.y = function () {
      return y;
    };
    return clone;
  }

  /**
   * Set the anchor on listeners.
   *
   * @param {object} anchor The anchor to set on.
   * @private
   */
  function setAnchorOn(anchor) {
    var startAnchor = null;

    // command name based on shape type
    var shapeDisplayName = dwv.tool.GetShapeDisplayName(shape);

    // drag start listener
    anchor.on('dragstart.edit', function (evt) {
      startAnchor = getClone(this);
      // prevent bubbling upwards
      evt.cancelBubble = true;
    });
    // drag move listener
    anchor.on('dragmove.edit', function (evt) {
      // update shape
      if (updateFunction) {
        updateFunction(this, image);
      } else {
        console.warn('No update function!');
      }
      // redraw
      if (this.getLayer()) {
        this.getLayer().draw();
      } else {
        console.warn('No layer to draw the anchor!');
      }
      // prevent bubbling upwards
      evt.cancelBubble = true;
    });
    // drag end listener
    anchor.on('dragend.edit', function (evt) {
      var endAnchor = getClone(this);
      // store the change command
      var chgcmd = new dwv.tool.ChangeGroupCommand(
        shapeDisplayName,
        updateFunction,
        startAnchor,
        endAnchor,
        this.getLayer(),
        image
      );
      chgcmd.onExecute = drawEventCallback;
      chgcmd.onUndo = drawEventCallback;
      chgcmd.execute();
      app.addToUndoStack(chgcmd);
      // reset start anchor
      startAnchor = endAnchor;
      // prevent bubbling upwards
      evt.cancelBubble = true;
    });
    // mouse down listener
    anchor.on('mousedown touchstart', function () {
      this.moveToTop();
    });
    // mouse over styling
    anchor.on('mouseover.edit', function () {
      // style is handled by the group
      this.stroke('#ddd');
      if (this.getLayer()) {
        this.getLayer().draw();
      } else {
        console.warn('No layer to draw the anchor!');
      }
    });
    // mouse out styling
    anchor.on('mouseout.edit', function () {
      // style is handled by the group
      this.stroke('#999');
      if (this.getLayer()) {
        this.getLayer().draw();
      } else {
        console.warn('No layer to draw the anchor!');
      }
    });
  }

  /**
   * Set the anchor off listeners.
   *
   * @param {object} anchor The anchor to set off.
   * @private
   */
  function setAnchorOff(anchor) {
    anchor.off('dragstart.edit');
    anchor.off('dragmove.edit');
    anchor.off('dragend.edit');
    anchor.off('mousedown touchstart');
    anchor.off('mouseover.edit');
    anchor.off('mouseout.edit');
  }
};
