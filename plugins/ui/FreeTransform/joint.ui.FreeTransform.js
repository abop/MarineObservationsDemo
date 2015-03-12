joint.ui.FreeTransform = Backbone.View.extend({

    className: 'free-transform',

    template: 'freetransform',

    events: {
	'mousedown .resize': 'startResizing',
        'mousedown .rotate': 'startRotating',
        'touchstart .resize': 'startResizing',
        'touchstart .rotate': 'startRotating'
    },

    options: {
        rotateAngleGrid: 15,
	preventAspectRatio: false,
	directions: ['nw','n','ne','e','se','s','sw','w']
    },

    initialize: function(options) {

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        if (this.options.cellView) {
            // The freetransform can be initalized by passing a single cellView option or
            // historically by passing all required references (cell, paper & graph).
            _.defaults(this.options, {
                cell: this.options.cellView.model,
                paper: this.options.cellView.paper,
                graph: this.options.cellView.paper.model
            });
        }

        _.bindAll(this, 'update', 'remove', 'pointerup', 'pointermove');

        // remove a previous instance
        joint.ui.FreeTransform.clear(this.options.paper);

	// Register mouse events.
        $(document.body).on('mousemove touchmove', this.pointermove);
        $(document).on('mouseup touchend', this.pointerup);

	// Update the freeTransform when the graph is changed.
        this.listenTo(this.options.graph, 'all', this.update);

	// Remove the freeTransform when the model is removed.
        this.listenTo(this.options.graph, 'reset', this.remove);
        this.listenTo(this.options.cell, 'remove', this.remove);

        // Hide the freeTransform when the user clicks anywhere in the paper or a new freeTransform is created.
        this.listenTo(this.options.paper, 'blank:pointerdown freetransform:create', this.remove);
        this.listenTo(this.options.paper, 'scale translate', this.update);

        this.options.paper.$el.append(this.el);
    },

    render: function() {

	this.$el.html(joint.templates['freetransform.html'](this.template));

	// We have to use `attr` as jQuery `data` doesn't update DOM
	this.$el.attr('data-type', this.options.cell.get('type'));
        this.$el.toggleClass('prevent-aspect-ratio', this.options.preventAspectRatio);
	this.update();
    },

    update: function() {

	var viewportCTM = this.options.paper.viewport.getCTM();

	var bbox = this.options.cell.getBBox();

	// Calculate the free transform size and position in viewport coordinate system.
	// TODO: take a viewport rotation in account.
	bbox.x *= viewportCTM.a;
	bbox.x += viewportCTM.e;
	bbox.y *= viewportCTM.d;
	bbox.y += viewportCTM.f;
	bbox.width *= viewportCTM.a;
	bbox.height *= viewportCTM.d;

	var angle = g.normalizeAngle(this.options.cell.get('angle') || 0);

	var transformVal =  'rotate(' + angle + 'deg)';

	this.$el.css({
            'width': bbox.width + 4,
	    'height': bbox.height + 4,
	    'left': bbox.x - 3,
	    'top': bbox.y - 3,
	    'transform': transformVal,
	    '-webkit-transform': transformVal, // chrome + safari
 	    '-ms-transform': transformVal // IE 9
        });

	// Update the directions on the halo divs while the element being rotated. The directions are represented
	// by cardinal points (N,S,E,W). For example the div originally pointed to north needs to be changed
	// to point to south if the element was rotated by 180 degrees.
	var shift = Math.floor(angle * (this.options.directions.length / 360));

	if (shift != this._previousDirectionsShift) {

	    // Create the current directions array based on the calculated shift.
	    var directions = _.rest(this.options.directions, shift).concat(_.first(this.options.directions, shift));

	    // Apply the array on the halo divs.
	    this.$('.resize').removeClass('nw n ne e se s sw w').each(function(index, el) {
		$(el).addClass(directions[index]);
	    });

	    this._previousDirectionsShift = shift;
	}
    },

    startResizing: function(evt) {

        evt.stopPropagation();

	this.options.graph.trigger('batch:start');

	// Target's data attribute can contain one of 8 positions. Each position defines the way how to
	// resize an element. Whether to change the size on x-axis, on y-axis or on both.

	var direction = $(evt.target).data('position');

	var rx = 0, ry = 0;

	_.each(direction.split('-'), function(singleDirection) {

	    rx = { 'left': -1, 'right': 1 }[singleDirection] || rx;
	    ry = { 'top': -1, 'bottom': 1 }[singleDirection] || ry;
	});

	// The direction has to be one of the 4 directions the element's resize method would accept (TL,BR,BL,TR).
	direction = {
	    'top': 'top-left',
	    'bottom': 'bottom-right',
	    'left' : 'bottom-left',
	    'right': 'top-right'
	}[direction] || direction;

	// The selector holds a function name to pick a corner point on a rectangle.
	// See object `rect` in `src/geometry.js`.
	var selector = {
	    'top-right' : 'bottomLeft',
	    'top-left': 'corner',
	    'bottom-left': 'topRight',
	    'bottom-right': 'origin'
	}[direction];

	// Expose the initial setup, so `pointermove` method can access it.
	this._initial = {
	    angle: g.normalizeAngle(this.options.cell.get('angle') || 0),
	    resizeX: rx, // to resize, not to resize or flip coordinates on x-axis (1,0,-1)
	    resizeY: ry, // to resize, not to resize or flip coordinates on y-axis (1,0,-1)
	    selector: selector,
	    direction: direction
	};

	this._action = 'resize';

	this.startOp(evt.target);
    },

    startRotating: function(evt) {

        evt.stopPropagation();

	this.options.graph.trigger('batch:start');
        
	var center = this.options.cell.getBBox().center();

	var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY }); 

	// Expose the initial setup, so `pointermove` method can acess it.
	this._initial = {
	    // the centre of the element is the centre of the rotation
	    centerRotation: center,
	    // an angle of the element before the rotating starts
	    modelAngle: g.normalizeAngle(this.options.cell.get('angle') || 0),
	    // an angle between the line starting at mouse coordinates, ending at the center of rotation
	    // and y-axis 
	    startAngle: g.point(clientCoords).theta(center)
	};

        this._action = 'rotate';

	this.startOp(evt.target);
    },

    pointermove: function(evt) {

	if (!this._action) return;

        evt = joint.util.normalizeEvent(evt);

	var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
	var gridSize = this.options.paper.options.gridSize;

	var model = this.options.cell, i = this._initial;

	switch (this._action) {

	case 'resize':

	    var currentRect = model.getBBox();

	    // The requested element's size has to be find on the unrotated element. Therefore we
	    // are rotating a mouse coordinates back (coimageCoords) by an angle the element is rotated by and
	    // with the center of rotation equals to the center of the unrotated element.
	    var coimageCoords= g.point(clientCoords).rotate(currentRect.center(), i.angle);

	    // The requested size is the difference between the fixed point and coimaged coordinates.
	    var requestedSize = coimageCoords.difference(currentRect[i.selector]());

	    // Calculate the new dimensions. `resizeX`/`resizeY` can hold a zero value if the resizing
	    // on x-axis/y-axis is not allowed.
	    var width = i.resizeX ? requestedSize.x * i.resizeX : currentRect.width;
	    var height = i.resizeY ? requestedSize.y * i.resizeY : currentRect.height;

            if (this.options.preventAspectRatio) {

                var candidateWidth = currentRect.width * height / currentRect.height;
                var candidateHeight = currentRect.height * width / currentRect.width;

                candidateWidth > width ? (height = candidateHeight) : (width = candidateWidth);
            }

	    // Constraint the dimensions.
	    width = width < gridSize ? gridSize : g.snapToGrid(width, gridSize);
	    height = height < gridSize ? gridSize : g.snapToGrid(height, gridSize);

	    // Resize the element only if the dimensions are changed.
	    if (currentRect.width != width || currentRect.height != height) {

                model.resize(width, height, { direction: i.direction });
	    }

	    break;

        case 'rotate':

	    // Calculate an angle between the line starting at mouse coordinates, ending at the centre
	    // of rotation and y-axis and deduct the angle from the start of rotation.
	    var theta = i.startAngle - g.point(clientCoords).theta(i.centerRotation);

            model.rotate(g.snapToGrid(i.modelAngle + theta, this.options.rotateAngleGrid), true);

            break;
	}
    },

    pointerup: function(evt) {

	if (!this._action) return;

	this.stopOp();

	this.options.graph.trigger('batch:stop');

	delete this._action;
	delete this._initial;
    },

    remove: function(evt) {

	Backbone.View.prototype.remove.apply(this, arguments);

        $('body').off('mousemove touchmove', this.pointermove);
        $(document).off('mouseup touchend', this.pointerup);
    },

    startOp: function(el) {

	if (el) {
	    // Add a class to the element we are operating with
	    $(el).addClass('in-operation');
	    this._elementOp = el;
	}

	this.$el.addClass('in-operation');
    },

    stopOp: function() {

	if (this._elementOp) {
	    // Remove a class from the element we were operating with
	    $(this._elementOp).removeClass('in-operation');
	    delete this._elementOp;
	}

	this.$el.removeClass('in-operation');
    }
}, {

    // removes a freetransform from a paper
    clear: function(paper) {

        paper.trigger('freetransform:create');
    }
});
