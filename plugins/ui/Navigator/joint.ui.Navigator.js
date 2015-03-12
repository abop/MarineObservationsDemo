// Navigator
// =========

// 'Navigator' creates a new paper (usually smaller) that helps select what part
// of the diagram is shown (especially for a larger diagram) and provides
// a different way how to zoom.

// Example usage:
//
// var nav = new joint.ui.Navigator({
//     paperScroller: paperScroller,
//     width: 200,
//     height: 200,
// });
//
// nav.$el.appendTo('#navigator');
// nav.render();

// TODO: fix zooming for 'grid' option != 0

joint.ui.Navigator = Backbone.View.extend({

    className: 'navigator',

    events: {
        'mousedown .paper': 'scrollTo',
        'touchstart .paper': 'scrollTo',
        'mousedown': 'startAction',
        'touchstart': 'startAction'
    },

    options: {
        paperConstructor: joint.dia.Paper,
        paperOptions: {},
        zoomOptions: { min: 0.1, max: 10 },
        width: 300,
        height: 200,
        padding: 10
    },

    initialize: function(options) {

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        _.bindAll(this, 'updateCurrentView', 'doAction', 'stopAction');

        // The updateCurrentView is called everytime paperScroller's scrollbars change
        // or the paper is resized. Resize of the paper is normally also acompanied
        // by a scrollbar change (but doesn't have to be). An event is triggered for
        // the vertical and horizontal scrollbar change. That leads to the updateCurrentView
        // to be called upto 4 times per one paperScroller action. Debouncing the method solves
        // this issue but there is definitely room for improvement.
        // + it solves an issue with wrong target paper position while zooming out a paper with
        // negative x-origin
        this.updateCurrentView = _.debounce(this.updateCurrentView, 0);

        var paperScroller = this.options.paperScroller;
        paperScroller.$el.on('scroll.navigator', this.updateCurrentView);

        var sourcePaper = this.sourcePaper = paperScroller.options.paper;
        this.listenTo(sourcePaper, 'resize', this.updatePaper);

        var targetPaper = this.targetPaper = new this.options.paperConstructor(_.extend({
            model: sourcePaper.model,
            interactive: false
        }, this.options.paperOptions));

        $(document.body).on({
            'mousemove.navigator touchmove.navigator': this.doAction,
            'mouseup.navigator touchend.navigator': this.stopAction
        });
    },

    render: function() {

        this.targetPaper.$el.appendTo(this.el);

        // Adding cell views requires the paper element to be appended to the DOM.
        this.sourcePaper.model.get('cells').each(this.targetPaper.addCell, this.targetPaper);
        
        this.$currentViewControl = $('<div>').addClass('current-view-control');
        this.$currentView = $('<div>').addClass('current-view').append(this.$currentViewControl);
        this.$el.append(this.$currentView).css({
            width: this.options.width,
            height: this.options.height,
            padding: this.options.padding
        });

        // setting right target paper dimension for the first time.
        this.updatePaper(this.sourcePaper.options.width, this.sourcePaper.options.height);

        return this;
    },

    // Updates the navigator's paper size and transformations
    updatePaper: function(width, height) {

        var sourceOrigin = this.sourcePaper.options.origin;
        var sourceScale = V(this.sourcePaper.viewport).scale();
        var navigatorWidth = this.options.width - 2 * this.options.padding;
        var navigatorHeight = this.options.height - 2 * this.options.padding;

        width /= sourceScale.sx;
        height /= sourceScale.sy;
        
        var ratio = this.ratio = Math.min(navigatorWidth / width, navigatorHeight / height);
        var ox = sourceOrigin.x * ratio / sourceScale.sx;
        var oy = sourceOrigin.y * ratio / sourceScale.sy;

        width *= ratio;
        height *= ratio;
        
        this.targetPaper.setDimensions(width, height);
        this.targetPaper.setOrigin(ox, oy);
        this.targetPaper.scale(ratio, ratio);

        this.updateCurrentView();
    },

    // Updates the position and size of the navigator's current view rectangle.
    updateCurrentView: function() {

        var ratio = this.ratio;
        var sourceScale = V(this.sourcePaper.viewport).scale();
        var paperScroller = this.options.paperScroller;
        var topLeftCoordinates = paperScroller.toLocalPoint(0,0);
        var paperPosition = this.targetPaper.$el.position();
        var paperOrigin = V(this.targetPaper.viewport).translate();

        // IE returns translate.ty = NaN when ty = 0. It sets transform attribute to 'translate(tx)'.
        // TODO: handle this in the vectorizer
        paperOrigin.ty = paperOrigin.ty || 0;

        this.currentViewGeometry = {
            top: paperPosition.top + topLeftCoordinates.y * ratio + paperOrigin.ty,
            left: paperPosition.left + topLeftCoordinates.x * ratio + paperOrigin.tx,
            width: paperScroller.$el.innerWidth() * ratio / sourceScale.sx,
            height: paperScroller.$el.innerHeight() * ratio / sourceScale.sy
        };

        this.$currentView.css(this.currentViewGeometry);
    },

    startAction: function(evt) {

        evt = joint.util.normalizeEvent(evt);

        // click on current-view control starts zooming
        // otherwise paper panning is initated.
        this._action = $(evt.target).hasClass('current-view-control')
            ? 'zooming'
            : 'panning';

        this._clientX = evt.clientX;
        this._clientY = evt.clientY;
    },
    
    doAction: function(evt) {

        if (!this._action) return;

        evt = joint.util.normalizeEvent(evt);

        var sourceScale = V(this.sourcePaper.viewport).scale();
        var dx = (evt.clientX - this._clientX) * sourceScale.sx;
        var dy = (evt.clientY - this._clientY) * sourceScale.sy;
        
        switch (this._action) {

          case 'panning':

            this.options.paperScroller.el.scrollLeft += dx / this.ratio;
            this.options.paperScroller.el.scrollTop += dy / this.ratio;

            break;

          case 'zooming':

            // dx/width is the ratio of the original width and the requested width
            var levelDiff =  - dx / this.currentViewGeometry.width;
            this.options.paperScroller.zoom(levelDiff, this.options.zoomOptions);

            break;
        }

        this._clientX = evt.clientX;
        this._clientY = evt.clientY;
    },

    stopAction: function() {

        delete this._action;
    },

    // Scrolls the view to the position determined by the event.
    scrollTo: function(evt) {

        evt = joint.util.normalizeEvent(evt);

        var paperOrigin = V(this.targetPaper.viewport).translate();
        // TODO: see updateCurrentView method
        paperOrigin.ty = paperOrigin.ty || 0;

        var offsetX, offsetY;
        // There is no offsetX/offsetY property in the Firefox event
        if (_.isUndefined(evt.offsetX)) {
            var targetPaperOffset = this.targetPaper.$el.offset(); 
            offsetX = evt.pageX - targetPaperOffset.left;
            offsetY = evt.pageY - targetPaperOffset.top;
        } else {
            offsetX = evt.offsetX;
            offsetY = evt.offsetY;
        }

        var cx = (offsetX - paperOrigin.tx) / this.ratio;
        var cy = (offsetY - paperOrigin.ty) / this.ratio;

        this.options.paperScroller.center(cx, cy);
    },

    remove: function() {

        this.targetPaper.remove();
        this.options.paperScroller.$el.off('.navigator');
        $(document.body).off('.navigator');

        Backbone.View.prototype.remove.apply(this, arguments);
    }

});
