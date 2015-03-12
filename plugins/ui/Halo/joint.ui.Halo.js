joint.ui.Halo = Backbone.View.extend({

    className: 'halo',

    events: {
        
        'mousedown .handle': 'onHandlePointerDown',
        'touchstart .handle': 'onHandlePointerDown'
    },

    options: {
	tinyTreshold: 40,
	smallTreshold: 80,
	loopLinkPreferredSide: 'top',
	loopLinkWidth: 40,
	rotateAngleGrid: 15,
        // This option allows you to compute bbox from the model. The view bbox can sometimes return
        // an unwanted result e.g when an element uses SVG filters or clipPaths. Note that downside
        // of computing a bbox is that it takes no relative subelements into account (e.g ports).
        useModelGeometry: false,
        // a function returning a html string, which will be used as the halo box content
        boxContent: function(cellView, boxElement) {

            var tmpl =  _.template('x: <%= x %>, y: <%= y %>, width: <%= width %>, height: <%= height %>, angle: <%= angle %>');

            var bbox = cellView.model.getBBox();

            return tmpl({
                x: Math.floor(bbox.x),
                y: Math.floor(bbox.y),
                width: bbox.width,
                height: bbox.height,
                angle: Math.floor(cellView.model.get('angle') || 0)
            });

        },
        // deprecated (better use joint.dia.Paper.options.linkModel)
	linkAttributes: {},
	smoothLinks: undefined,
        handles: [
            { name: 'resize', position: 'se', events: { pointerdown: 'startResizing', pointermove: 'doResize', pointerup: 'stopBatch' } },
            { name: 'remove', position: 'nw', events: { pointerdown: 'removeElement' } },
            { name: 'clone', position: 'n', events: { pointerdown: 'startCloning', pointermove: 'doClone', pointerup: 'stopCloning' } },
            { name: 'link', position: 'e', events: { pointerdown: 'startLinking', pointermove: 'doLink', pointerup: 'stopLinking' } },
            { name: 'fork', position: 'ne', events: { pointerdown: 'startForking', pointermove: 'doFork', pointerup: 'stopForking' } },
            { name: 'unlink', position: 'w', events: { pointerdown: 'unlinkElement' } },
            { name: 'rotate', position: 'sw', events: { pointerdown: 'startRotating', pointermove: 'doRotate', pointerup: 'stopBatch' } }
        ]
    },

    initialize: function(options) {

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        _.defaults(this.options, {
            paper: this.options.cellView.paper,
            graph: this.options.cellView.paper.model
        });

        _.bindAll(this, 'pointermove', 'pointerup', 'render', 'update', 'remove');

        // Clear a previous halo if there was one for the paper.
        joint.ui.Halo.clear(this.options.paper);

        // Add handles.
        this.handles = [];
        _.each(this.options.handles, this.addHandle, this);

	// Update halo when the graph changed.
        this.listenTo(this.options.graph, 'reset', this.remove);
        this.listenTo(this.options.graph, 'all', this.update);
        // Hide Halo when the user clicks anywhere in the paper or a new halo is created.
        this.listenTo(this.options.paper, 'blank:pointerdown halo:create', this.remove);
        this.listenTo(this.options.paper, 'scale translate', this.update);

        $(document.body).on('mousemove touchmove', this.pointermove);
        $(document).on('mouseup touchend', this.pointerup);

        this.options.paper.$el.append(this.$el);
    },

    render: function() {

        this.options.cellView.model.on('remove', this.remove);

        this.$el.append(joint.templates.halo['box.html']());

	this.renderMagnets();

        this.update();

        this.$el.addClass('animate');
        
        // Add the `data-type` attribute with the `type` of the cell to the root element.
        // This makes it possible to style the halo (including hiding/showing actions) based
        // on the type of the cell.
        this.$el.attr('data-type', this.options.cellView.model.get('type'));

	this.toggleFork();

        return this;
    },

    update: function() {

        if (this.options.cellView.model instanceof joint.dia.Link) return;
        
        if (_.isFunction(this.options.boxContent)) {

            var $box = this.$('.box');
            var content = this.options.boxContent.call(this, this.options.cellView, $box[0]);

            // don't append empty content. (the content might had been created inside boxContent()
            if (content) {
                $box.html(content);
            }
        }

        var bbox = this.options.cellView.getBBox({ useModelGeometry: this.options.useModelGeometry });

	this.$el.toggleClass('tiny', bbox.width < this.options.tinyTreshold && bbox.height < this.options.tinyTreshold);
	this.$el.toggleClass('small', !this.$el.hasClass('tiny') && (bbox.width < this.options.smallTreshold && bbox.height < this.options.smallTreshold));

	this.$el.css({

            width: bbox.width,
            height: bbox.height,
            left: bbox.x,
            top: bbox.y

        }).show();

	this.updateMagnets();

	this.toggleUnlink();
    },

    addHandle: function(opt) {

        this.handles.push(opt);
        
        this.$el.append(joint.templates.halo['handle.html'](opt));

        _.each(opt.events, function(method, event) {

            if (_.isString(method)) {

                this.on('action:' + opt.name + ':' + event, this[method], this);
                
            } else {
                // Otherwise, it must be a function.

                this.on('action:' + opt.name + ':' + event, method);
            }
            
        }, this);
        
        return this;
    },

    removeHandle: function(name) {

        var handleIdx = _.findIndex(this.handles, { name: name });
        var handle = this.handles[handleIdx];
        if (handle) {
            
            _.each(handle.events, function(method, event) {
                
                this.off('action:' + name + ':' + event);
                
            }, this);
            
            this.$('.handle.' + name).remove();

            this.handles.splice(handleIdx, 1);
        }

        return this;
    },

    changeHandle: function(name, opt) {

        var handle = _.findWhere(this.handles, { name: name });
        if (handle) {
            
            this.removeHandle(name);
            this.addHandle(_.merge({ name: name }, handle, opt));
        }
        
        return this;
    },

    onHandlePointerDown: function(evt) {

        this._action = $(evt.target).closest('.handle').attr('data-action');
        if (this._action) {

            evt.preventDefault();
            evt.stopPropagation();
            evt = joint.util.normalizeEvent(evt);

            this._clientX = evt.clientX;
            this._clientY = evt.clientY;
            this._startClientX = this._clientX;
            this._startClientY = this._clientY;

            this.triggerAction(this._action, 'pointerdown', evt);
        }
    },

    // Trigger an action on the Halo object. `evt` is a DOM event, `eventName` is an abstracted
    // JointJS event name (pointerdown, pointermove, pointerup).
    triggerAction: function(action, eventName, evt) {
        
        var args = ['action:' + action + ':' + eventName].concat(_.rest(_.toArray(arguments), 2));
        this.trigger.apply(this, args);
    },

    startCloning: function(evt) {

	this.options.graph.trigger('batch:start');
        
        var clone = this.options.cellView.model.clone();
        clone.unset('z');
        this.options.graph.addCell(clone, { halo: this.cid });

        this._cloneView = clone.findView(this.options.paper);
        this._cloneView.pointerdown(evt, this._clientX, this._clientY);
    },

    startLinking: function(evt) {

	this.options.graph.trigger('batch:start');

        var cellView = this.options.cellView;
        var selector = $.data(evt.target, 'selector');
        var link = this.options.paper.getDefaultLink(cellView, selector && cellView.el.querySelector(selector));

	link.set('source', { id: cellView.model.id, selector: selector });
        link.set('target', { x: evt.clientX, y: evt.clientY });

	link.attr(this.options.linkAttributes);
        if (_.isBoolean(this.options.smoothLinks)) {
            link.set('smooth', this.options.smoothLinks);
        }

	// add link to graph but don't validate
        this.options.graph.addCell(link, { validation: false, halo: this.cid });

        link.set('target', this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY }));

        this._linkView = this.options.paper.findViewByModel(link);
        this._linkView.startArrowheadMove('target');
    },

    startForking: function(evt) {

	this.options.graph.trigger('batch:start');
        
        var clone = this.options.cellView.model.clone();
        clone.unset('z');
        this.options.graph.addCell(clone, { halo: this.cid });

        var link = this.options.paper.getDefaultLink(this.options.cellView);

	link.set('source', { id: this.options.cellView.model.id });
        link.set('target', { id: clone.id });

	link.attr(this.options.linkAttributes);
        if (_.isBoolean(this.options.smoothLinks)) {
            link.set('smooth', this.options.smoothLinks);
        }

        this.options.graph.addCell(link, { halo: this.cid });

        this._cloneView = clone.findView(this.options.paper);
        this._cloneView.pointerdown(evt, this._clientX, this._clientY);
    },

    startResizing: function(evt) {

	this.options.graph.trigger('batch:start');
        
        // determine whether to flip x,y mouse coordinates while resizing or not
        this._flip = [1,0,0,1,1,0,0,1][
            Math.floor(g.normalizeAngle(this.options.cellView.model.get('angle')) / 45)
        ];
    },

    startRotating: function(evt) {

	this.options.graph.trigger('batch:start');
        
        var bbox = this.options.cellView.getBBox();
        
        this._center = g.rect(bbox).center();

	//mousemove event in firefox has undefined offsetX and offsetY
	if (typeof evt.offsetX === 'undefined' || typeof evt.offsetY === 'undefined') {
	    var targetOffset = $(evt.target).offset();
	    evt.offsetX = evt.pageX - targetOffset.left;
	    evt.offsetY = evt.pageY - targetOffset.top;
	}

        this._rotationStart = g.point(evt.offsetX + evt.target.parentNode.offsetLeft, evt.offsetY + evt.target.parentNode.offsetTop + evt.target.parentNode.offsetHeight);

        var angle = this.options.cellView.model.get('angle');

        this._rotationStartAngle = angle || 0;
    },

    doResize: function(evt, dx, dy) {

        var size = this.options.cellView.model.get('size');

        var width = Math.max(size.width + ((this._flip ? dx : dy)), 1);
        var height = Math.max(size.height + ((this._flip ? dy : dx)), 1);

        this.options.cellView.model.resize(width, height, { absolute: true });
    },

    doRotate: function(evt, dx, dy, tx, ty) {

        var p = g.point(this._rotationStart).offset(tx, ty);
        var a = p.distance(this._center);
        var b = this._center.distance(this._rotationStart);
        var c = this._rotationStart.distance(p);
        var sign = (this._center.x - this._rotationStart.x) * (p.y - this._rotationStart.y) - (this._center.y - this._rotationStart.y) * (p.x - this._rotationStart.x);

        var _angle = Math.acos((a*a + b*b - c*c) / (2*a*b));

        // Quadrant correction.
        if (sign <= 0) {
            _angle = -_angle;
        }
        
        var angleDiff = -g.toDeg(_angle);

        angleDiff = g.snapToGrid(angleDiff, this.options.rotateAngleGrid);
        
        this.options.cellView.model.rotate(angleDiff + this._rotationStartAngle, true);
    },

    doClone: function(evt) {

        this._cloneView.pointermove(evt, this._clientX, this._clientY);
    },

    doFork: function(evt) {

        this._cloneView.pointermove(evt, this._clientX, this._clientY);
    },

    doLink: function(evt) {

        var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
        
        this._linkView.pointermove(evt, clientCoords.x, clientCoords.y);
    },

    stopLinking: function(evt) {
        
        this._linkView.pointerup(evt);

        var sourceId = this._linkView.model.get('source').id;
        var targetId = this._linkView.model.get('target').id;

	if (sourceId && targetId && (sourceId === targetId)) {
	    this.makeLoopLink(this._linkView.model);
	}

        this.stopBatch();

        this.triggerAction('link', 'add', this._linkView.model);

	delete this._linkView;
    },
    
    stopForking: function(evt) {

        this._cloneView.pointerup(evt, this._clientX, this._clientY);
        this.stopBatch();
    },

    stopCloning: function(evt) {

        this._cloneView.pointerup(evt, this._clientX, this._clientY);
        this.stopBatch();
    },

    pointermove: function(evt) {

        if (!this._action) return;

        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);

        var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
        var oldClientCoords = this.options.paper.snapToGrid({ x: this._clientX, y: this._clientY });
        
        var dx = clientCoords.x - oldClientCoords.x;
        var dy = clientCoords.y - oldClientCoords.y;

        this.triggerAction(this._action, 'pointermove', evt, dx, dy, evt.clientX - this._startClientX, evt.clientY - this._startClientY);
        
        this._clientX = evt.clientX;
        this._clientY = evt.clientY;
    },

    pointerup: function(evt) {

        if (!this._action) return;

        this.triggerAction(this._action, 'pointerup', evt);

        delete this._action;
    },

    stopBatch: function() {
        
        this.options.graph.trigger('batch:stop');
    },

    remove: function(evt) {

	Backbone.View.prototype.remove.apply(this, arguments);

        $(document.body).off('mousemove touchmove', this.pointermove);
        $(document).off('mouseup touchend', this.pointerup);
    },

    removeElement: function(evt) {

        this.options.cellView.model.remove();
    },

    unlinkElement: function(evt) {

        this.options.graph.removeLinks(this.options.cellView.model);
    },

    toggleUnlink: function() {

	if (this.options.graph.getConnectedLinks(this.options.cellView.model).length > 0) {
	    this.$('.unlink').show()
	} else {
	    this.$('.unlink').hide()
	}
    },

    toggleFork: function() {

        // temporary create a clone model and its view
        var clone = this.options.cellView.model.clone();
        var cloneView = this.options.paper.createViewForModel(clone);

        // if a connection after forking would not be valid, hide the fork icon
        if (!this.options.paper.options.validateConnection(this.options.cellView,null,cloneView,null,'target')) {
	    this.$('.fork').hide();
        }

        cloneView.remove();
        clone = null;
    },

    makeLoopLink: function(link) {

	var linkWidth = this.options.loopLinkWidth;
	var paperOpt = this.options.paper.options;
	var paperRect = g.rect({x: 0, y: 0, width: paperOpt.width, height: paperOpt.height});
	var bbox = V(this.options.cellView.el).bbox(false, this.options.paper.viewport);
	var p1, p2;

	var sides = _.uniq([this.options.loopLinkPreferredSide, 'top', 'bottom', 'left', 'right']);
	var sideFound = _.find(sides, function(side) {

	    var centre, dx = 0, dy = 0;

	    switch (side) {

	    case 'top':
		centre = g.point(bbox.x + bbox.width / 2, bbox.y - linkWidth);
		dx = linkWidth / 2;
		break;

	    case 'bottom':
		centre = g.point(bbox.x + bbox.width / 2, bbox.y + bbox.height + linkWidth);
		dx = linkWidth / 2;
		break;

	    case 'left':
		centre = g.point(bbox.x - linkWidth, bbox.y + bbox.height / 2);
		dy = linkWidth / 2;
		break;

	    case 'right':
		centre = g.point(bbox.x + bbox.width + linkWidth, bbox.y + bbox.height / 2);
		dy = linkWidth / 2;
		break;
	    };

	    p1 = g.point(centre).offset(-dx, -dy);
	    p2 = g.point(centre).offset(dx, dy);

	    return paperRect.containsPoint(p1) && paperRect.containsPoint(p2);
	}, this);

	if (sideFound) link.set('vertices', [p1,p2]);
    },

    // Magnet functions

    renderMagnets: function() {

	this._magnets = [];

	var $link = this.$('.link');
	var magnetElements = this.options.cellView.$('[magnet="true"]');

	if (this.options.magnetFilter) {

	    if (_.isFunction(this.options.magnetFilter)) {

		// We want function to be called with a magnet element as the first parameter. Not an index
		// as jQuery.filter would do it.
		magnetElements = _.filter(magnetElements, this.options.magnetFilter);

	    } else {

		// Every other case runs jQuery.filter method
		magnetElements = magnetElements.filter(this.options.magnetFilter);
	    }
	}

	if ($link.length && magnetElements.length) {

	    var linkWidth = $link.width();
	    var linkHeight = $link.height();

	    _.each(magnetElements, function(magnetElement) {

		var magnetClientRect = magnetElement.getBoundingClientRect();

		var $haloElement = $link.clone()
		    .addClass('halo-magnet')
		    .css({
			width: Math.min(magnetClientRect.width, linkWidth),
			height: Math.min(magnetClientRect.height, linkHeight),
			'background-size': 'contain'
		    })
		    .data('selector', this.options.cellView.getSelector(magnetElement))
		    .appendTo(this.$el);

		this._magnets.push({ $halo: $haloElement, el: magnetElement });

	    }, this);
	}

	// disable linking & forking from the element itself if is it not a magnet
	if (this.options.cellView.$el.attr('magnet') == 'false') {
	    $link.hide();
	    this.$('.fork').hide();
	}
    },

    updateMagnets: function() {

	if (this._magnets.length) {

	    var hClientRect = this.el.getBoundingClientRect();

	    // adjust position of each halo magnet
	    _.each(this._magnets, function(magnet) {

		var mClientRect = magnet.el.getBoundingClientRect();

		magnet.$halo.css({
		    left: mClientRect.left - hClientRect.left + (mClientRect.width - magnet.$halo.width())/2,
		    top: mClientRect.top - hClientRect.top + (mClientRect.height - magnet.$halo.height())/2
		});

	    }, this);
	}
    }

}, {

    // removes a halo from a paper
    clear: function(paper) {

        paper.trigger('halo:create');
    }
});
