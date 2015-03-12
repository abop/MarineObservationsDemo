// Tree Graph Layout View.
// =======================

// An user interface for the tree layout manipulation.

joint.ui.TreeLayoutView = Backbone.View.extend({

    className: 'tree-layout',

    options: {
        maxConnectionDistance: 200,
        maxCalloutDistance: 100, // Number | { x: Number, y: Number }
        minCalloutDistance: 1, // Number | { x: Number, y: Number }
        mainRootReachDistance: 100,
        xCoordinateOffset: 20,
        previewAttrs: {
            child: { rx: '50%', ry: '50%' },
            parent: { rx: 2, ry: 2 }
        },
        useModelGeometry: false
    },

    initialize: function(options) {

	options = this.options = _.extend({}, _.result(this, 'options'), options || {});

        this.toggleDefaultInteraction(false);
        this.startListening();
        this.render();
    },

    render: function() {

        var paper = this.options.paper;

        this.$activeBox = $('<div>').addClass('tree-layout-box active').hide().appendTo(this.el);
        this.$translateBox = $('<div>').addClass('tree-layout-box translate').hide().appendTo(this.el);
        this.svgViewport = V(paper.viewport);
        this.svgPreviewChild = V('rect').attr(this.options.previewAttrs.child || {}).addClass('tree-layout-preview child');
        this.svgPreviewLink = V('path').attr(this.options.previewAttrs.link || {}).addClass('tree-layout-preview link');
        this.svgPreviewParent = V('rect').attr(this.options.previewAttrs.parent || {}).addClass('tree-layout-preview parent');
        this.svgCalloutLine = V('line').addClass('tree-layout-callout-line');
        this.svgPreview = V('g').addClass('tree-layout-preview-group').append([
            this.svgPreviewLink,
            this.svgPreviewParent,
            this.svgPreviewChild
        ]);

        this.$el.appendTo(paper.el);

        return this;
    },

    remove: function() {

        this.svgCalloutLine.remove();
        this.svgPreview.remove();
        return Backbone.View.prototype.remove.apply(this, arguments);
    },

    // @public
    startListening: function() {

        var paper = this.options.paper;

        this.listenTo(paper, 'cell:pointerdown', this.onPointerdown);
        this.listenTo(paper, 'cell:pointermove', this.onPointermove);
        this.listenTo(paper, 'cell:pointerup', this.onPointerup);
    },

    // @public
    // Enable/Disable the default paper interactions.
    toggleDefaultInteraction: function(interactive) {

        var paper = this.options.paper;

        // New elements added to the paper will not be interactive.
        paper.options.interactive = interactive;

        // Set interactive to false to all existing elements.
        _.chain(paper.model.getElements()).map(paper.findViewByModel, paper).each(function(view) {
            view && (view.options.interactive = interactive);
        });
    },

    // @private
    showChildPreview: function(child, parent, index, rankDir) {

        var childPosition = this.getChildPosition(parent.id, index, rankDir);

        // let preview always fit inbetween 2 siblings
        var previewChildSize = this.model.get('verticalGap') / 2;
        this.svgPreviewChild.attr({
            x: childPosition.x - (rankDir == this.model.RANK_LEFT ? 9 : 0), // size of preview = 9px TODO!
            y: childPosition.y,
            width: previewChildSize,
            height: previewChildSize
        });

        this.svgPreviewParent.attr(parent.getBBox());
        this.svgPreviewLink.attr('d', this.getChildPathData(parent.id, childPosition, rankDir));
        this.svgViewport.append(this.svgPreview);
    },

    // @private
    hideChildPreview: function() {
        this.svgPreview.remove();
    },

    // @private
    showCalloutLine: function(calloutId, x, y) {

        var calloutGeometry = this.model.getGeometry(calloutId);
        var parentGeometry = this.model.getGeometry(this.model.getCallerOf(calloutId));

        this.svgViewport.append(this.svgCalloutLine.attr({
            x1: x + calloutGeometry.width / 2,
            y1: y + calloutGeometry.height / 2,
            x2: parentGeometry.cx,
            y2: parentGeometry.cy
        }));
    },

    // @private
    hideCalloutLine: function() {
        this.svgCalloutLine.remove();
    },

    // @private
    getChildPosition: function(parentId, index, rankDir) {

        var x,y;
        var children = this.model.getChildrenOf(parentId, { rankDir: rankDir });
        var verticalGap = this.model.get('verticalGap');
        var horizontalGap = this.model.get('horizontalGap');

        if  (!_.isEmpty(children)) {

            var nextSiblingId = children[index];
            
            if (nextSiblingId) {
                var nextSibling = this.model.getGeometry(nextSiblingId);
                x = nextSibling.x;
                y = nextSibling.y - verticalGap / 4 - verticalGap / 2;
                if (rankDir == this.model.RANK_LEFT) x += nextSibling.width;
            } else {
                var prevSibling = this.model.getGeometry(children[index - 1]);
                x = prevSibling.x;
                y = prevSibling.y + prevSibling.height + verticalGap / 4;
                if (rankDir == this.model.RANK_LEFT) x += prevSibling.width;
            }

        } else {

            var layoutArea = this.model.getLayoutArea(parentId);

            var xOffset;
            switch (rankDir) {
              case this.model.RANK_LEFT: xOffset = - horizontalGap; break;
              case this.model.RANK_RIGHT: xOffset = layoutArea.width + horizontalGap; break;
            }

            x = layoutArea.x + xOffset;
            y = layoutArea.y + (layoutArea.height - layoutArea.bottomPadding + layoutArea.topPadding) / 2 - verticalGap / 4;
        }

        return { x: x, y: y };
    },

    // @private
    getChildPathData: function(parentId, childPosition, rankDir) {

        var parentGeometry = this.model.getGeometry(parentId);

        var x1 = parentGeometry.x + (rankDir == this.model.RANK_LEFT ? 0 : parentGeometry.width);
        var y1 = parentGeometry.cy;
        var x2 = childPosition.x;
        var y2 = childPosition.y + this.model.get('verticalGap') / 4;
        var x3 = x1 + (x2-x1) / 2;

        return 'M ' + [x1, y1, x3, y1, x3, y2, x2, y2].join(' ');
    },

    // @private
    isConnectionValid: function(parentId, childId, index, rankDir) {

        // Banning a loop connection
        if (childId == parentId) return false;

        // If the element is ancestor of parent, there would be a loop after connection.
        if (this.model.isDescendantOf(parentId, childId)) return false;

        // If we have same parent, same rank direction an we changing only the siblingRank
        // we allow only changes that actually changes the order of siblings.
        var child = this.model.getElement(childId);
        if (child.parentId == parentId && child.rankDir == rankDir) {
            var rankChange = child.siblingRank - index;
            if (rankChange === 0 || rankChange === 1) return false;
        }

        return true;
    },

    // @private
    isPointInExtendedArea: function(area, p, d) {

        // extend the element area of the element
        return g.rect(area).moveAndExpand(g.rect(-d, -d, 2*d, 2*d)).containsPoint(p);
    },

    // @private
    transformCoordinates: function(coordinates, x, offset) {
        coordinates.x = (coordinates.x > x)
            ? Math.max(coordinates.x - this.options.xCoordinateOffset, x + 1)
            : Math.min(coordinates.x + this.options.xCoordinateOffset, x - 1);
    },

    // @private
    reconnectCell: function(cell, parent, index, rankDir) {

        // Tell layout that the cell belongs between siblings index and index+1.
        // Note that N childs of a parent have `siblingRank` set always from 1 to N.
        cell.set('siblingRank', index + 0.5);

        // Set rank direction for all cell's descendants
        _.each(this.model.getDescendantsOf(cell.id, { includeCallouts: true }).concat(cell.id), function(descendantId) {
            this.model.graph.getCell(descendantId).set('rankDir', rankDir);
        }, this);

        this.model.connect(cell.id, parent.id, { ui: true, link: this.getDefaultLinkByCell(parent) });
    },

    // @private
    // Get and returns a default link from paper based on the given cell.
    getDefaultLinkByCell: function(cell) {

        var parentView = cell.findView(this.options.paper);
        return this.options.paper.getDefaultLink(parentView, parentView.el);
    },

    // @private
    translateCell: function(cell, x, y) {

        cell.position(x,y);

        if (this.model.getElement(cell.id).parentLinkId) {
            this.model.disconnect(cell.id, { ui: true });
        } else {
            this.model.layout({ ui: true, rootId: cell.id });
        }
    },

    // @private
    translateCallout: function(cell, dx, dy) {

        // A helper to guard value to be always smaller than {max} for positive {value}
        // and greater than -{max} for negative {value}. Similar for the minimum{min}.
        function limit(value, min, max) {
            return value > 0 ? Math.max(min, Math.min(value, max)) : Math.min(-min, Math.max(value, -max));
        }

        var callout = this.model.getElement(cell.id);
        var parentLayoutArea = this.model.getLayoutArea(this.model.getCallerOf(callout.id));
        var parentHeight = (parentLayoutArea.height - parentLayoutArea.topPadding - parentLayoutArea.bottomPadding) / 2 + callout.layoutArea.height/2;

        var cdy = callout.cdy + dy;
        if (callout.cdy > 0) {
            cdy < 0 && (cdy = -cdy < parentHeight ? 1 : Math.min(-1, cdy + parentHeight + callout.geometry.height));
        } else {
            cdy > 0 && (cdy = cdy < parentHeight ? -1 : Math.max(1, cdy - parentHeight - callout.geometry.height));
        }

        // find maximal and minimal distances from settings
        var dMax = this.options.maxCalloutDistance;
        var dMin = this.options.minCalloutDistance;
        var dxMax = _.isNumber(dMax) ? dMax : dMax.x || 0;
        var dxMin = _.isNumber(dMin) ? dMin : dMin.x || 0;
        var dyMax = _.isNumber(dMax) ? dMax : dMax.y || 1;
        var dyMin = _.isNumber(dMin) ? dMin || 1 : dMin.y || 1;

        cell.set({
            calloutDx: Math.min(Math.max(dxMin, callout.cdx + dx), dxMax),
            calloutDy: limit(cdy, dyMin, dyMax)
        });

        this.model.prepare().layout({ ui: true, changedCalloutId: cell.id });
    },

    // @private
    getDeltaCoordinations: function(x1, x2, y1, y2, rankDir) {
        return { dx: rankDir == this.model.RANK_RIGHT ? x1 - x2 : x2 - x1, dy: y1 - y2 };
    },

    // Interaction
    // -----------

    onPointerdown: function(cellView, evt, x, y) {

        if (cellView.model.isLink()) return;

        var bbox = cellView.getBBox({ useModelGeometry: this.options.useModelGeometry });

        this._x = x;
        this._y = y;
        this.ctm = this.options.paper.viewport.getCTM();
        // distance from target element origin to the pointer coordinates
        var position = cellView.model.position();
        this._targetDx = x - position.x;
        this._targetDy = y - position.y;

        // showing box around active element
        this.$activeBox.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y }).show();
        this.$translateBox.css({ width: bbox.width, height: bbox.height });

        this.rootId = this.model.getRootOf(cellView.model.id);
        this.mainRoot = this.model.mainRootId
            ? this.model.getElement(this.model.mainRootId)
            : null;
        this.isCallout = !!this.model.getCallerOf(cellView.model.id);
    },

    onPointermove: function(cellView, evt, x, y) {

        if (cellView.model.isLink()) return;

        var cell = cellView.model;

        // Callout translating
        if (this.isCallout) {
            var tx = x - this._targetDx;
            var ty = y - this._targetDy;
            this.$translateBox.css({ left: tx * this.ctm.a + this.ctm.e, top: ty * this.ctm.d + this.ctm.f }).show();
            this.showCalloutLine(cell.id, tx, ty);
            return;
        }

        var coordinates = g.point(x, y);
        // apply xCoordinateOffset based on the position of the main root
        if (this.options.xCoordinateOffset && this.mainRoot) {
            this.transformCoordinates(coordinates, this.mainRoot.geometry.cx, this.options.xCoordinateOffset);
        }

        // find the candidate root
        var candidateRootId = this.model.getMinimalRootByPoint(coordinates, { includeCallouts: true });

        // If there is no candidate check the distance to the main root (if present)
        if (!candidateRootId && this.mainRoot && this.isPointInExtendedArea(this.mainRoot.geometry, coordinates, this.options.mainRootReachDistance)) {
            candidateRootId = this.mainRoot.id;
        }

        if (candidateRootId) {

            var layoutArea = this.model.getLayoutAreaByPoint(candidateRootId, coordinates) || this.mainRoot.layoutArea;
            var candidateGeometry = this.model.getGeometry(layoutArea.rootId);
            var candidateDistance = candidateGeometry.cx - coordinates.x;
            var rankDir = this.rankDir = (layoutArea.rankDir == this.model.RANK_CENTER)
                ? candidateDistance < 0 ? this.model.RANK_RIGHT : this.model.RANK_LEFT
                : layoutArea.rankDir;
            var siblingIndex = this.model.getSiblingRankByPoint(layoutArea.rootId, coordinates, { rankDir: rankDir });
        }

        if (this.candidateView) {
            this.candidateView = null;
            this.hideChildPreview();
        }

        // checking wheather connection or translate should be proceed
        if (candidateRootId && Math.abs(candidateDistance) < this.options.maxConnectionDistance) {

            this.$translateBox.hide();

            if (this.isConnectionValid(layoutArea.rootId, cell.id, siblingIndex, rankDir)) {
                this.candidateSiblingIndex = siblingIndex;
                this.candidateView = this.options.paper.findViewByModel(layoutArea.rootId);
                this.showChildPreview(cell, this.candidateView.model, siblingIndex, rankDir);
            }

        } else {

            this.$translateBox.css({ left: x * this.ctm.a + this.ctm.e, top: y * this.ctm.d + this.ctm.f }).show();
        }
    },

    onPointerup: function(cellView, evt, x, y) {

        if (cellView.model.isLink()) return;

        if (this.candidateView) {
            this.reconnectCell(cellView.model, this.candidateView.model, this.candidateSiblingIndex, this.rankDir);
            this.candidateView = null;
        }

        if (this.$translateBox.is(':visible')) {

            if (this.isCallout) {
                var calloutRankDir = this.model.getElement(cellView.model.id).rankDir;
                var dCoords = this.getDeltaCoordinations(x, this._x, y, this._y, calloutRankDir);
                this.translateCallout(cellView.model, dCoords.dx, dCoords.dy);
                this.hideCalloutLine();
            } else {
                this.translateCell(cellView.model, x, y);
            }
        }

        this.$activeBox.hide();
        this.$translateBox.hide();
        this.hideChildPreview();
    }
});
