// PaperScroller
// =============


// `PaperScroller` wraps the paper root element and implements panning and centering of the paper.

// Example usage:

//      var paperScroller = new joint.ui.PaperScroller;
//      var paper = new joint.dia.Paper({ el: paperScroller.el });
//      paperScroller.options.paper = paper;
//      $appElement.append(paperScroller.render().el);

//      paperScroller.center();
//      paper.on('blank:pointerdown', paperScroller.startPanning);



joint.ui.PaperScroller = Backbone.View.extend({

    className: 'paper-scroller',

    events: {
        'mousedown': 'pointerdown',
        'mousemove': 'pointermove',
        'touchmove': 'pointermove',
        'mouseout': 'stopPanning'
    },

    options: {
        paper: undefined,
        padding: 0,
        autoResizePaper: false,
        minWidth: undefined,
        minHeight: undefined
    },

    initialize: function(options) {

        _.bindAll(this, 'startPanning', 'stopPanning');

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        var paper = this.options.paper;

        // keep scale values for a quicker access
        var initScale = V(paper.viewport).scale();
        this._sx = initScale.sx;
        this._sy = initScale.sy;

	// keep the original paper size
	this._baseWidth = paper.options.width;
	this._baseHeight = paper.options.height;

        this.$el.append(paper.el);
        this.addPadding();

	this.listenTo(paper, 'scale', this.onScale);
	this.listenTo(paper, 'resize', this.onResize);

	// automatically resize the paper
	if (this.options.autoResizePaper) {

	    this.listenTo(paper.model, 'change add remove reset', this.adjustPaper);
	}

        $(document.body).on('mouseup.stopPanning touchend.stopPanning', this.stopPanning);
    },

    onResize: function() {

	// Move scroller so the user sees the same area as before the resizing.
        if (this._center) this.center(this._center.x, this._center.y);
    },

    onScale: function(sx, sy, ox, oy) {

        // update scale values for a quicker access
        this._sx = sx;
        this._sy = sy;

        this.adjustPaper();

	// Move scroller to scale origin.
        if (ox || oy) this.center(ox, oy);
    },

    beforePaperManipulation: function() {
        // IE is trying to show every frame while we manipulate the paper.
        // That makes the viewport kind of jumping while zooming for example.
        // Make the paperScroller invisible fixes this.
        this.$el.css('visibility', 'hidden');
    },

    afterPaperManipulation: function() {

        this.$el.css('visibility', 'visible');
    },

    toLocalPoint: function(x,y) {

        var ctm = this.options.paper.viewport.getCTM();

        x += this.el.scrollLeft - this.padding.paddingLeft - ctm.e;
        x /= ctm.a;

        y += this.el.scrollTop - this.padding.paddingTop - ctm.f;
        y /= ctm.d;

        return g.point(x, y);
    },

    adjustPaper: function() {

        // store the current mid point of visible paper area, so we can center the paper
        // to the same point after the resize
        this._center = this.toLocalPoint(this.el.clientWidth / 2, this.el.clientHeight/ 2);

        var sx = this._sx;
        var sy = this._sy;
        var options = {
            gridWidth: this._baseWidth * sx,
            gridHeight: this._baseHeight * sy,
            allowNewOrigin: 'negative'
        };

        if (this.options.minWidth) {
            options.minWidth = this.options.minWidth * sx;
        }

        if (this.options.minHeight) {
            options.minHeight = this.options.minHeight * sy;
        }

	this.options.paper.fitToContent(options);

        return this;
    },

    // Adjust the paper position so the point [x,y] is moved to the center of paperScroller element.
    // If no point given [x,y] equals to center of the paper element.
    center: function(x, y) {

        var ctm = this.options.paper.viewport.getCTM();

        // the paper rectangle
        // x1,y1 ---------
        // |             |
        // ----------- x2,y2
        var x1 = -ctm.e;
        var y1 = -ctm.f;
        var x2 = x1 + this.options.paper.options.width;
        var y2 = y1 + this.options.paper.options.height;

        if (_.isUndefined(x) || _.isUndefined(y)) {
            // find center of the paper rect
            x = (x1 + x2) / 2;
            y = (y1 + y2) / 2;
        } else {
            // local coordinates to viewport coordinates
            x *= ctm.a;
            y *= ctm.d;
        }

        var p = this.options.padding;
        var cx = this.el.clientWidth / 2;
        var cy = this.el.clientHeight / 2;

        // calculate paddings
        var left   = cx - p - x + x1;
        var right  = cx - p + x - x2;
        var top    = cy - p - y + y1;
        var bottom = cy - p + y - y2;

        this.addPadding(Math.max(left,0), Math.max(right,0), Math.max(top,0), Math.max(bottom,0));

	this.el.scrollLeft = x - cx + ctm.e + this.padding.paddingLeft;
	this.el.scrollTop  = y - cy + ctm.f + this.padding.paddingTop;

        return this;
    },

    centerContent: function() {

	var vbox = V(this.options.paper.viewport).bbox(true, this.options.paper.svg);
	this.center(vbox.x + vbox.width / 2, vbox.y + vbox.height / 2);

        return this;
    },

    // Adds padding to the scroller element so the paper element inside can be positioned.
    addPadding: function(left, right, top, bottom) {

        var base = this.options.padding;

        var padding = this.padding = {
            paddingLeft: Math.round(base + (left || 0)),
            paddingTop: Math.round(base + (top || 0))
        };

        // It is not possible to apply paddingBottom and paddingRight on paperScroller as it
        // would have no effect while overflow in FF and IE.
        // see 'https://bugzilla.mozilla.org/show_bug.cgi?id=748518'
        var margin =  {
            marginBottom: Math.round(base + (bottom || 0)),
            marginRight: Math.round(base + (right || 0))
        };

        // Make sure that at least a fragment of the paper is always visible on the screen.
        // Note that paddingLeft can not be greater than paper scroller clientWidth as
        // we would loose the scrollbars (same for paddingTop). At least 10% of visible area
        // is used by paper.
        padding.paddingLeft = Math.min(padding.paddingLeft, this.el.clientWidth * 0.9);
        padding.paddingTop = Math.min(padding.paddingTop, this.el.clientHeight * 0.9);

        this.$el.css(padding);
        this.options.paper.$el.css(margin);

        return this;
    },

    zoom: function(value, opt) {

        opt = opt || {};

        var center = this.toLocalPoint(this.el.clientWidth / 2, this.el.clientHeight/ 2);
        var sx = value;
        var sy = value;
        var ox;
        var oy;

        if (!opt.absolute) {
            sx += this._sx;
            sy += this._sy;
        }

        if (opt.grid) {
            sx = Math.round(sx / opt.grid) * opt.grid;
            sy = Math.round(sy / opt.grid) * opt.grid;
        }

        // check if the new scale won't exceed the given boundaries
        if (opt.max) {
            sx = Math.min(opt.max, sx);
            sy = Math.min(opt.max, sy);
        }

        if (opt.min) {
            sx = Math.max(opt.min, sx);
            sy = Math.max(opt.min, sy);
        }

        if (_.isUndefined(opt.ox) || _.isUndefined(opt.oy)) {

            // if the origin is not specified find the center of the paper's visible area.
            ox = center.x;
            oy = center.y;

        } else {

            var fsx = sx / this._sx;
            var fsy = sy / this._sy;

            ox = opt.ox - ((opt.ox - center.x) / fsx);
            oy = opt.oy - ((opt.oy - center.y) / fsy);
        }

        this.beforePaperManipulation();

        this.options.paper.scale(sx, sy);
        this.center(ox, oy);

        this.afterPaperManipulation();

        return this;
    },

    zoomToFit: function(opt) {

        opt = opt || {};

        var paper = this.options.paper;
        var paperOrigin = _.clone(paper.options.origin);

        // fitting bbox has exact size of the the PaperScroller
        opt.fittingBBox = opt.fittingBBox || _.extend({}, g.point(paperOrigin), {
            width: this.$el.width() + this.padding.paddingLeft,
            height: this.$el.height() + this.padding.paddingTop
        });

        this.beforePaperManipulation();

        // scale the vieport
        paper.scaleContentToFit(opt);

        // restore original origin
        paper.setOrigin(paperOrigin.x, paperOrigin.y);

        this.adjustPaper().centerContent();

        this.afterPaperManipulation();

        return this;
    },

    startPanning: function(evt) {

        evt = joint.util.normalizeEvent(evt);

        this._panning = true;

        this._clientX = evt.clientX;
        this._clientY = evt.clientY;
    },

    pan: function(evt) {

        if (!this._panning) return;

        evt = joint.util.normalizeEvent(evt);

        var dx = evt.clientX - this._clientX;
        var dy = evt.clientY - this._clientY;

        this.el.scrollTop -= dy;
        this.el.scrollLeft -= dx;

        this._clientX = evt.clientX;
        this._clientY = evt.clientY;
    },

    stopPanning: function() {

        delete this._panning;
    },

    pointerdown: function(evt) {
        // redelagate pointerdown events from around the paper to the paper
        if (evt.target == this.el) {
            this.options.paper.pointerdown.apply(this.options.paper, arguments);
        }
    },

    pointermove: function(evt) {

        this.pan.apply(this, arguments);

        // redelagate pointermove events from around the paper to the paper
        if (evt.target == this.el) {
            this.options.paper.pointermove.apply(this.options.paper, arguments);
        }
    },

    remove: function() {

        Backbone.View.prototype.remove.apply(this, arguments);
        
        $(document.body).off('.stopPanning', this.stopPanning);
    }
});
