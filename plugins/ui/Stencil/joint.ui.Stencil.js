// JointJS Stencil ui plugin.
// --------------------------

// USAGE:
// var graph = new joint.dia.Graph;
// var paper = new joint.dia.Paper({
//    el: $('#paper'),
//    width: 500,
//    height: 300,
//    gridSize: 20,
//    perpendicularLinks: true,
//    model: graph
// });
// 
// var stencil = new joint.ui.Stencil({ graph: graph, paper: paper });
// $('#stencil-holder').append(stencil.render().el);


joint.ui.Stencil = Backbone.View.extend({

    className: 'stencil',

    events: {
        
        'click .group-label': 'onGroupLabelClick',
        'touchstart .group-label': 'onGroupLabelClick',
        'input .search': 'onSearch'
    },

    options: {
        width: 200,
        height: 800
    },

    initialize: function(options) {

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        this.graphs = {};
        this.papers = {};
        this.$groups = {};

        _.bindAll(this, 'onDrag', 'onDragEnd');

        $(document.body).on({
            'mousemove.stencil touchmove.stencil': this.onDrag,
            'mouseup.stencil touchend.stencil': this.onDragEnd
        });

        this.onSearch = _.debounce(this.onSearch, 200);
    },
    
    render: function() {

        this.$el.html(joint.templates.stencil['stencil.html'](this.template));
        this.$content = this.$('.content');

        if (this.options.search) {
            this.$el.addClass('searchable').prepend(joint.templates.stencil['search.html']());
        }

        var paperOptions = {
            width: this.options.width,
            height: this.options.height,
            interactive: false
        };

        if (this.options.groups) {
            // Render as many papers as there are groups and put them inside the `'group.html'` template.
            
            var sortedGroups = _.sortBy(_.pairs(this.options.groups), function(pair) { return pair[1].index });
            _.each(sortedGroups, function(groupArray) {

                var name = groupArray[0];
                var group = groupArray[1];
                
                var $group = $(joint.templates.stencil['group.html']({ label: group.label || name }));
                $group.attr('data-name', name);
                if (group.closed) $group.addClass('closed');
                $group.append($(joint.templates.stencil['elements.html']()));
                this.$content.append($group);
                this.$groups[name] = $group;
                
                var graph = new joint.dia.Graph;
                this.graphs[name] = graph;
                var paper = new joint.dia.Paper(_.extend({}, paperOptions, {
                    el: $group.find('.elements'),
                    model: graph,
                    width: group.width || paperOptions.width,
                    height: group.height || paperOptions.height
                }));
                this.papers[name] = paper;
                
            }, this);
            
        } else {
            // Groups are not used. Render just one paper for the whole stencil.

            this.$content.append($(joint.templates.stencil['elements.html']()));
            var graph = new joint.dia.Graph;
            // `this.graphs` object contains only one graph in this case that we store under the key `'__default__'`.
            this.graphs['__default__'] = graph;
            var paper = new joint.dia.Paper(_.extend(paperOptions, {
                el: this.$('.elements'),
                model: graph
            }));
            this.papers['__default__'] = paper;
        }

        // Create graph and paper objects for the, temporary, dragging phase.
        // Elements travel the following way when the user drags an element from the stencil and drops
        // it into the main, associated, paper: `[One of the Stencil graphs] -> [_graphDrag] -> [this.options.graph]`.
        this._graphDrag = new joint.dia.Graph;
        this._paperDrag = new joint.dia.Paper({

            el: this.$('.stencil-paper-drag'),
            width: 1,
            height: 1,
            model: this._graphDrag
        });

        // `cell:pointerdown` on any of the Stencil papers triggers element dragging.
        _.each(this.papers, function(paper) {
            this.listenTo(paper, 'cell:pointerdown', this.onDragStart);
        }, this);

        return this;
    },

    // @public Populate stencil with `cells`. If `group` is passed, only the graph in the named group
    // will be populated.
    load: function(cells, group) {

        var graph = this.graphs[group || '__default__'];
        if (graph) {
            graph.resetCells(cells);
            // If height is not defined in neither the global `options.height` or local
            // `height` for this specific group, fit the paper to the content automatically.
            var paperHeight = this.options.height;
            if (group && this.options.groups[group]) {
                paperHeight = this.options.groups[group].height;
            }
            if (!paperHeight) {
                this.papers[group || '__default__'].fitToContent(1, 1, this.options.paperPadding || 10);
            }
        } else {
            throw new Error('Stencil: group ' + group + ' does not exist.');
        }
    },

    getGraph: function(group) {
        
        return this.graphs[group || '__default__'];
    },

    getPaper: function(group) {
        
        return this.papers[group || '__default__'];
    },
    
    onDragStart: function(cellView, evt) {
        
        this.$el.addClass('dragging');
        this._paperDrag.$el.addClass('dragging');
        // Move the .stencil-paper-drag element to the document body so that even though
        // the stencil is set to overflow: hidden or auto, the .stencil-paper-drag will
        // be visible.
        $(document.body).append(this._paperDrag.$el);
        
        this._clone = cellView.model.clone();
        this._cloneBbox = cellView.getBBox();

        // Leave some padding so that e.g. the cell shadow or thick border is visible.
        // This workaround can be removed once browsers start supporting getStrokeBBox() (http://www.w3.org/TR/SVG2/types.html#__svg__SVGGraphicsElement__getStrokeBBox).
        var padding = 5;

        // Compute the difference between the real (view) bounding box and the model bounding box position.
        // This makes sure that elements that are outside the model bounding box get accounted for too.
        var shift = g.point(this._cloneBbox.x - this._clone.get('position').x, this._cloneBbox.y - this._clone.get('position').y);

        this._clone.set('position', { x: -shift.x + padding, y: -shift.y + padding });
        this._graphDrag.addCell(this._clone);
        this._paperDrag.setDimensions(this._cloneBbox.width + 2*padding, this._cloneBbox.height + 2*padding);

        // Safari uses `document.body.scrollTop` only while Firefox uses `document.documentElement.scrollTop` only.
        // Google Chrome is the winner here as it uses both.
        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

        // Offset the paper so that the mouse cursor points to the center of the stencil element.
        this._paperDrag.$el.offset({
            left: evt.clientX - this._cloneBbox.width/2,
            top: evt.clientY + scrollTop - this._cloneBbox.height/2
        });
    },

    onDrag: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        
        if (this._clone) {

            var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

            // Offset the paper so that the mouse cursor points to the center of the stencil element.
            this._paperDrag.$el.offset({
                left: evt.clientX - this._cloneBbox.width/2,
                top: evt.clientY + scrollTop - this._cloneBbox.height/2
            });
        }
    },

    onDragEnd: function(evt) {
        
        evt = joint.util.normalizeEvent(evt);

        if (this._clone && this._cloneBbox) {

            this.drop(evt, this._clone.clone(), this._cloneBbox);

            // Move the .stencil-paper-drag from the document body back to the stencil element.
            this.$el.append(this._paperDrag.$el);
            
            this.$el.removeClass('dragging');
            this._paperDrag.$el.removeClass('dragging');
            
            this._clone.remove();
            this._clone = undefined;
        }
    },

    drop: function(evt, cell, cellViewBBox) {

        var paper = this.options.paper;
        var graph = this.options.graph;
        
        var paperPosition = paper.$el.offset();
        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
        
        var paperArea = g.rect(
            paperPosition.left + parseInt(paper.$el.css("border-left-width"),10) - scrollLeft,
            paperPosition.top + parseInt(paper.$el.css("border-top-width"),10) - scrollTop,
            paper.$el.innerWidth(),
            paper.$el.innerHeight()
        );

	var p = paper.svg.createSVGPoint();
        p.x = evt.clientX;
        p.y = evt.clientY;

        // Check if the cell is dropped inside the paper.
        if (paperArea.containsPoint(p)) {

            // This is a hack for Firefox! If there wasn't a fake (non-visible) rectangle covering the
            // whole SVG area, `$(paper.svg).offset()` used below won't work.
            var fakeRect = V('rect', { width: paper.options.width, height: paper.options.height, x: 0, y: 0, opacity: 0 });
            V(paper.svg).prepend(fakeRect);
            
            var paperOffset = $(paper.svg).offset();

            // Clean up the fake rectangle once we have the offset of the SVG document.
            fakeRect.remove();

	    p.x += scrollLeft - paperOffset.left;
	    p.y += scrollTop - paperOffset.top;

	    // Transform point into the viewport coordinate system.
	    var pointTransformed = p.matrixTransform(paper.viewport.getCTM().inverse());

	    var cellBBox = cell.getBBox();
	    pointTransformed.x += cellBBox.x - cellViewBBox.width / 2;
	    pointTransformed.y += cellBBox.y - cellViewBBox.height / 2;

            cell.set('position', {
		x: g.snapToGrid(pointTransformed.x, paper.options.gridSize),
		y: g.snapToGrid(pointTransformed.y, paper.options.gridSize)
	    });

            // `z` level will be set automatically in the `this.graph.addCell()` method.
            // We don't want the cell to have the same `z` level as it had in the temporary paper.
            cell.unset('z');

            graph.addCell(cell, { stencil: this.cid });
        }
    },

    filter: function(keyword, cellAttributesMap) {

        // a searching mode when the keyword consists of lowercase only
        // e.g 'keyword' matches 'Keyword' but not other way round
        var lowerCaseOnly = keyword.toLowerCase() == keyword;

        // We go through each paper.model, filter its cells and watch whether we found a match
        // yet or not.
        var match = _.reduce(this.papers, function(wasMatch, paper, group) {

            // an array of cells that matches a search criteria
            var matchedCells = paper.model.get('cells').filter(function(cell) {

                var cellView = paper.findViewByModel(cell);

                // check whether the currect cell matches a search criteria
                var cellMatch = !keyword || _.some(cellAttributesMap, function(paths, type) {

                    if (type != '*' && cell.get('type') != type) {
                        // type is not universal and doesn't match the current cell
                        return false;
                    }

                    // find out if any of specific cell attributes matches a search criteria
                    var attributeMatch = _.some(paths, function(path) {

                        var value = joint.util.getByPath(cell.attributes, path, '/');

                        if (_.isUndefined(value) || _.isNull(value)) {
                            // if value undefined than current attribute doesn't match
                            return false;
                        }

                        // convert values to string first (e.g value could be a number)
                        value = value.toString();

                        if (lowerCaseOnly) {
                            value = value.toLowerCase();
                        }

                        return value.indexOf(keyword) >= 0;
                    });

                    return attributeMatch;
                });

                // each element that does not match a search has 'unmatched' css class
                V(cellView.el).toggleClass('unmatched', !cellMatch);

                return cellMatch;

            }, this);

            var isMatch = !_.isEmpty(matchedCells);

            // create a graph contains only filtered elements.
            var filteredGraph = (new joint.dia.Graph).resetCells(matchedCells);

            // let the outside world know that the group was filtered
            this.trigger('filter', filteredGraph, group);

            if (this.$groups[group]) {
                // add 'unmatched' class when filter matches no elements in the group
                this.$groups[group].toggleClass('unmatched', !isMatch);
            }

            paper.fitToContent(1, 1, this.options.paperPadding || 10);

            return wasMatch || isMatch;

        }, false, this);

        // When no match found we add 'not-found' class on the stencil element
        this.$el.toggleClass('not-found', !match);
    },

    onSearch: function(evt) {

        this.filter(evt.target.value, this.options.search);
    },

    onGroupLabelClick: function(evt) {

        // Prevent default action for iPad not to handle this event twice.
        evt.preventDefault();
        
        var $group = $(evt.target).closest('.group');
        this.toggleGroup($group.data('name'));
    },

    toggleGroup: function(name) {

        this.$('.group[data-name="' + name + '"]').toggleClass('closed');
    },

    closeGroup: function(name) {
        
        this.$('.group[data-name="' + name + '"]').addClass('closed');
    },

    openGroup: function(name) {
        
        this.$('.group[data-name="' + name + '"]').removeClass('closed');
    },

    closeGroups: function() {

        this.$('.group').addClass('closed');
    },

    openGroups: function() {

        this.$('.group').removeClass('closed');
    },

    remove: function() {

        Backbone.View.prototype.remove.apply(this, arguments);
        $(document.body).off('.stencil', this.onDrag).off('.stencil', this.onDragEnd);
    }
});

