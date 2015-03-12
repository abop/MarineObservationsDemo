// Tree Graph Layout.
// ==================

joint.layout.TreeLayout = Backbone.Model.extend({

    RANK_LEFT: 'L',
    RANK_RIGHT: 'R',
    RANK_CENTER: 'C',

    defaults: {
        verticalGap: 10,
        horizontalGap: 10,
        defaultRankDir: null,
        defaultLink: new joint.dia.Link,
        benchmark: false
    },

    initialize: function() {

        this.graph = this.get('graph');
        this.prepare();
    },

    // Public API (layout)
    // -------------------

    // @public
    // Layouts the graph.
    layout: function(opt) {

        opt = opt || {};

        var id = opt.rootId;

        if (!id) {

            _.each(this.roots, function(rootId) {
                this.layout(_.extend({ rootId: rootId, partial: true }, opt));
            }, this);

        } else {

            this.elements[id].layoutArea = this.benchmark('computeLayoutArea', id);
            this.benchmark('positionElements', id, true);
            this.benchmark('positionLinks', id);
        }

        !opt.partial && this.trigger('layout:done', opt);

        return this;
    },

    // @public
    // Gathers all informations from the graph required for the layouting.
    prepare: function() {

        var verticalGap = this.get('verticalGap');
        var elements = {};
        var calloutRoots = [];

        this.get('graph').get('cells').each(function(cell) {

            if (cell.isLink()) {

                var sourceId = cell.get('source').id;
                var targetId = cell.get('target').id;
                var source = (elements[sourceId] = elements[sourceId] || {});
                var target = (elements[targetId] = elements[targetId] || {});

                source.children = (source.children || []).concat(targetId);
                target.parentId = sourceId;
                target.parentLinkId = cell.id;

                cell.get('hidden') && (source.containsHidden = true);

            } else {

                var element = (elements[cell.id] = elements[cell.id] || {});
                var size = cell.get('size');

                element.id = cell.id;
                // We don't know the position yet. The position is found in the layout phase.
                element.geometry = _.clone(size);
                // siblingRank starts from 1. Sibling with the highest rank is parents last child.
                element.siblingRank = cell.get('siblingRank') || Infinity;
                element.rankDir = cell.get('rankDir') || null;
                element.hidden = cell.get('hidden') || false;
                element.hiddenByRankDir = {};
                element.offsetx = cell.get('offsetX') || 0;
                // Callouts
                element.callerId = cell.get('callout') || null;
                if (element.callerId) {
                    element.cdy = cell.get('calloutDy') || verticalGap;
                    element.cdx = cell.get('calloutDx') || 0;
                    !element.hidden && calloutRoots.push(element.id);
                }
            }
        });

        this.elements = elements;
        this.roots = [];
        this.mainRootId = null;
        this.calloutRoots = calloutRoots;

        _.each(elements, function(element) {

            // sort childrens according their rank
            element.children = _.sortBy(element.children, function(child) {
                return elements[child].siblingRank;
            });

            if (!element.parentId) {

                if (element.callerId) {
                    elements[element.callerId].callouts = (elements[element.callerId].callouts || []).concat(element.id);
                } else {
                    this.roots.push(element.id);
                    if (element.rankDir == this.RANK_CENTER) {
                        if (this.mainRootId) {
                            throw new Error('Too many central roots.');
                        }
                        this.mainRootId = element.id;
                    }
                }
            }

        }, this);

        _.each(this.roots, function(rootId) { this.updateRankDirAndLevel(rootId, 0); }, this);

        return this;
    },

    // Public API (nodes manipulation)
    // -------------------------------

    // @public
    // Execute method{fn} for each descendant (links included).
    // Options {getDescendantsOf}|{getChildrenOf}|'applyOnly'|'includeInvisible'|'includeLinks'
    applyOnDescendants: function(id, fn, opt) {

        opt = _.extend({ includeInvisible: true, includeLinks: true }, opt);

        var descendants = opt.deep
            ? this.getDescendantsOf(id, opt)
            : this.getChildrenOf(id, opt);

        _.each(descendants, function(descendantId) {
            if (opt.includeLinks) {
                var parentLinkId = this.elements[descendantId].parentLinkId;
                parentLinkId && fn.call(this, parentLinkId, opt);
            }
            fn.call(this, descendantId, opt);
        }, this);

        (!opt.applyOnly) && this.prepare().layout(opt);
    },

    // @public
    // Options 'connectOnly'|'link'
    connect: function(id, parentId, opt) {

        opt = opt || {};
        _.extend(opt, {
            oldParentId: null,
            newParentId: parentId
        });

        var cell = this.graph.getCell(id);
        var parentLink = this.graph.getCell(this.elements[id] && this.elements[id].parentLinkId);
        var isParentCollapsed = this.isCollapsed(parentId);

        if (parentLink) {
            // reconnection
            opt.oldParentId = parentLink.get('source').id;
            parentLink.set({
                source: { id: parentId },
                hidden: isParentCollapsed
            });
        } else if (cell.has('callout')) {
            // connect as a callout
            cell.set('callout', parentId);
        } else {
            // create a new connection
            var newLink = opt.link || this.get('defaultLink').clone();
            newLink.set({
                source: { id: parentId },
                target: { id: id },
                hidden: isParentCollapsed
            });
            this.graph.addCell(newLink);
        }

        cell.set('hidden', isParentCollapsed);

        opt.connectOnly || this.prepare().layout(opt);

        return this;
    },

    // @public
    // Disconnect an element{id} making it a new root.
    // Options 'disconnectOnly'
    disconnect: function(id, opt) {

        var parentLink = this.graph.getCell(this.elements[id].parentLinkId);
        var parentId = this.elements[id].parentId;

        if (parentLink) {

            _.extend(opt, {
                oldParentId: parentLink.get('source').id,
                newParentId: null
            });

            parentLink.remove();

            (!opt || !opt.disconnectOnly) && this.prepare().layout(opt);
        }

        return this;
    },

    // @public
    // Removes an element{id} with or without all its descendants.
    // Options 'includeCallouts'|'deep'|'deepExpand'
    remove: function(id, opt) {

        opt = _.extend({ includeCallouts: true }, opt);

        if (opt.deep) {

            _.each(this.getDescendantsOf(id, opt).concat(id), function(descendantId) {
                this.graph.getCell(descendantId).remove();
            }, this);

        } else {

            var element = this.elements[id];

            if (this.isCollapsed(id)) {
                // if the children elements are collapsed, they need to be expanded
                // otherwise an inconsistant situation can occured when the root
                // is being removed or the element has siblings.
                this.expand(id, { deep: !!opt.deepExpand, expandOnly: true });
            }

            if (element.parentLinkId) {

                var childrenCells = _.map(element.children, this.graph.getCell, this.graph);
                var linkCells = _.map(element.children, function(childId) {
                    return this.graph.getCell(this.elements[childId].parentLinkId);
                }, this);

                this.graph.getCell(element.parentLinkId).remove();

                var rankDomain = [0, linkCells.length - 1];
                var rankRange = [element.siblingRank - 0.5, element.siblingRank + 0.5];

                // Reconnect all links from the element to original element's parent.
                // Set sibling rank for each children to value, which is between `siblingRank`
                // of element's neighbouring children. This way we manage to have reconnected
                // children located on the exact same position as the element.
                _.each(linkCells, function(link, i) {
                    link.set('source', { id: element.parentId });
                    childrenCells[i].set('siblingRank', g.scale.linear(rankDomain, rankRange, i));
                }, this);
            }

            // It's save now to remove element, as we don't loose any important links.
            // Cell.prototype.remove([{ disconnectLinks: false }]) removes also all connected links.
            this.graph.getCell(id).remove();
        }

        (!opt.removeOnly) && this.prepare().layout(opt);
    },

    // @public
    // Clones an element{id} with all its descendants (links included).
    // Options 'includeCallouts'|'deep'
    clone: function(id, opt) {

        opt = _.extend({ includeCallouts: true, deep: true }, opt);
        // links are handled seperately
        opt.includeLinks = false;

        var clone = this.graph.getCell(id).clone().unset('rankDir');
        var cloneElements = [clone];
        var cloneLinks = [];

        var cloneMap = {};
        cloneMap[id] = clone.id;

        this.applyOnDescendants(id, _.bind(function(descendantId) {

            var descendant = this.elements[descendantId];
            var descendantClone = this.graph.getCell(descendantId).clone();

            cloneMap[descendantId] = descendantClone.id;
            cloneElements.push(descendantClone);

            if (descendant.parentLinkId) {

                var cloneLink = this.graph.getCell(descendant.parentLinkId).clone().set({
                    source: { id: cloneMap[descendant.parentId] },
                    target: { id: descendantClone.id }
                });

                cloneLinks.push(cloneLink);

            } else {

                descendantClone.set('callout', cloneMap[descendantClone.get('callout')]);
            }

        }, this), opt);

        var clones = cloneElements.concat(cloneLinks);

        if (opt.includeCallouts) {

            _.each(this.elements[id].callouts, function(calloutId) {
                var calloutClones = this.clone(calloutId, opt);
                calloutClones[0].set('callout', clone.id);
                Array.prototype.push.apply(clones, calloutClones);
            }, this);
        }

        return clones;
    },

    // @public
    // Hides all descendants of element{id}.
    collapse: function(id, opt) {

        opt = opt || {};

        this.applyOnDescendants(id, function(descendantId) {
            this.graph.getCell(descendantId).set('hidden', true);
        }, _.extend({ deep: true, includeCallouts: true, applyOnly: !!opt.collapseOnly }, opt));
    },

    // @public
    // Makes all descendants of element{id} visible.
    expand: function(id, opt) {

        opt = opt || {};

        this.applyOnDescendants(id, function(descendantId) {
            this.graph.getCell(descendantId).set('hidden', false);
        }, _.extend({ deep: true, includeCallouts: true, applyOnly: !!opt.expandOnly }, opt));
    },

    // Public API (getters)
    // --------------------

    // @public
    getElement: function(id) {
        return this.elements[id];
    },

    // @public
    getGeometry: function(id) {
        return this.elements[id].geometry;
    },

    // @public
    getLayoutArea: function(id) {
        return this.elements[id].layoutArea;
    },

    // @public
    // Returns an array of children's ids of element{id}.
    // Options 'includeInvisible'|'rankDir'|'includeCallouts'.
    getChildrenOf: function(id, opt) {

        opt = opt || {};

        var callouts = [];
        var children = _.filter(this.elements[id].children, function(childId) {
            var child = this.elements[childId];
            if (!opt.includeInvisible && !this.isVisible(childId)) return false;
            if (opt.rankDir && opt.rankDir != child.rankDir) return false;
            if (opt.includeCallouts && !_.isEmpty(child.callouts)) {
                Array.prototype.push.apply(callouts, this.getCalloutsOf(childId));
            }
            return true;
        }, this);

        return children.concat(callouts);
    },

    // @public
    // Returns an array of descendant's ids of element{id}.
    // Options 'includeInvisible'|'rankDir'|'includeCallouts'.
    getDescendantsOf: function(id, opt) {

        opt = _.extend({ includeInvisible: true }, opt);

        var children = this.getChildrenOf(id, opt);

        return _.reduce(children, function(res, childId) {
            return res.concat(this.getDescendantsOf(childId, opt));
        }, children || [], this);
    },

    // @public
    // Returns an array of element{id}'s callouts
    getCalloutsOf: function(id) {

        return _.reduce(this.elements[id].callouts, function(res, calloutId) {
            return res.concat(calloutId, this.getCalloutsOf(calloutId));
        }, [], this);
    },

    // @public
    // Returns the caller of a callout{id}
    getCallerOf: function(id) {
        return this.elements[id].callerId;
    },

    // @public
    // Returns the smallest layoutArea that contains given point.
    getLayoutAreaByPoint: function(id, p) {

        var layoutArea = this.getLayoutArea(id);

        if (!g.rect(layoutArea).containsPoint(p)) return null;

        _.some(this.getChildrenOf(id), function(childId) {
            var childLayoutArea = this.getLayoutAreaByPoint(childId, p);
            return childLayoutArea && (layoutArea = childLayoutArea);
        }, this);

        return layoutArea;
    },

    // @public
    // Returns an index of a child that is the closest to given point.
    getSiblingRankByPoint: function(id, p, opt) {

        var siblings = this.getChildrenOf(id, opt) || [];

        for (var i = 0, length = siblings.length; i < length; i++) {
            var childLayoutArea = this.elements[siblings[i]].layoutArea;
            if (childLayoutArea.y + childLayoutArea.height / 2 > p.y) break;
        }

        return i;
    },

    // @public
    // Returns root of the element{id} ie. element with no parent.
    getRootOf: function(id) {

        var parent = id;

        while (parent) {
            id = parent;
            parent = this.elements[id].parentId;
        }

        return id;
    },

    // @public
    // Finds elements (their ids), that are not descendants of any element in the input elements array.
    getLocalRootsOf: function(ids) {

        var localRoots = _.reject(ids, function(id1) {
            return _.some(ids, function(id2) {
                return this.isDescendantOf(id1, id2);
            }, this);
        }, this);

        return localRoots;
    },

    // @public
    // Finds a root with the smallest layoutArea (width/height) which contains given point.
    getMinimalRootByPoint: function(p, opt) {

        var roots = this.roots;

        opt = opt || {};
        opt.includeCallouts && Array.prototype.push.apply(roots, this.calloutRoots);

        var minimalRootLayoutArea = _.chain(roots)
            .map(this.getLayoutArea, this)
            .filter(function(layoutArea) { return g.rect(layoutArea).containsPoint(p); })
            .min(function(layoutArea) { return layoutArea.width * layoutArea.height; })
            .value();

        return minimalRootLayoutArea.rootId;
    },

    // Public API (predicates)
    // -----------------------

    // @public
    // Determinate if the element 'a' is descendant of the element 'b'
    isDescendantOf: function(a, b) {

        // Each element has either one parent, one caller or none of those two
        a = this.elements[a].parentId || this.elements[a].callerId;

        while (a) {
            if (a==b) return true;
            a = this.elements[a].parentId || this.elements[a].callerId;
        }

        return false;
    },

    // @public
    // Determine if the element 'b' is direct child of the element 'a'
    isParentOf: function(a, b) {
        return this.elements[b] && this.elements[b].parentId == a;
    },

    // @public
    // Is the element 'id' set as hidden.
    isVisible: function(id) {
        return !this.elements[id].hidden;
    },

    // @public
    // Determine if all children of the element 'id' are visible. Otherwise the element is collapsed.
    // If 'rankDir' provided check children with the given direction only (Make sense for the central
    // element only).
    isCollapsed: function(id, rankDir) {
        var element = this.elements[id];
        return element && element.containsHidden && (!rankDir || element.hiddenByRankDir[rankDir]);
    },

    // Private methods
    // ---------------

    // @private
    // Recursively walk trough all the elements and finds their level(depth) and logical rank direction
    // based on its parent rank direction.
    updateRankDirAndLevel: function(id, level, prevDir) {

        var defaultRankDir = this.get('defaultRankDir') || this.RANK_RIGHT;
        var element = this.elements[id];
        var rankDir = element.rankDir || defaultRankDir;

        level > 1 && (rankDir = prevDir);
        level > 0 && element.parentId && element.hidden && (this.elements[element.parentId].hiddenByRankDir[rankDir] = true);

        element.rankDir = rankDir;
        element.level = level++;

        var children = element.children;
        _.isEmpty(element.callouts) || (children = children.concat(element.callouts));
        _.each(children, function(childId) { this.updateRankDirAndLevel(childId, level, rankDir); }, this);
    },

    // @private
    // Computes padding based on the callouts layout areas.
    computeLayoutAreaPadding: function(id) {

        return _.transform(this.elements[id].callouts, function(padding, calloutId) {

            var callout = this.elements[calloutId];
            callout.cdy > 0
                ? (padding.bottom = Math.max(padding.bottom, callout.cdy + callout.layoutArea.height))
                : (padding.top = Math.max(padding.top, callout.layoutArea.height - callout.cdy));

        }, { top: 0, bottom: 0 }, this);
    },

    // @private
    // Recursively computes layout areas for all descendant of element{id}.
    computeLayoutArea: function(id) {

        var verticalGap = this.get('verticalGap');
        var horizontalGap = this.get('horizontalGap');
        var element = this.elements[id];
        var heightByDir = {};
        var widthByDir = {};

        _.each(element.callouts, this.computeLayoutArea, this);

        var padding = this.computeLayoutAreaPadding(id);
        var layoutArea = {
            rootId: id,
            width: element.geometry.width,
            height: padding.top + element.geometry.height + padding.bottom,
            dx: element.offsetx,
            dy: 0,
            rankDir: element.rankDir,
            topPadding: padding.top,
            bottomPadding: padding.bottom
        };
        // Start the recursion. Compute children layout areas first.
        var mixedChildrenLayoutAreas = _.map(this.getChildrenOf(id), this.computeLayoutArea, this);
        // Group the layout areas by their rank L|R
        var childrenLayoutAreasByDir = _.groupBy(mixedChildrenLayoutAreas, 'rankDir');

        _.each(childrenLayoutAreasByDir, function(childrenLayoutAreas, direction) {

            var childrenHeight = padding.top;
            var childrenWidth = 0;

            _.each(childrenLayoutAreas, function(childLayoutArea) {
                childLayoutArea.dy += childrenHeight;
                childLayoutArea.dx += element.geometry.width + horizontalGap;
                childrenHeight += childLayoutArea.height + verticalGap;
                childrenWidth = Math.max(childrenWidth, childLayoutArea.width + horizontalGap);
            });

            childrenHeight -= verticalGap;
            childrenHeight += padding.bottom;

            var noPaddingChildrenHeight = childrenHeight - padding.top - padding.bottom;
            if (element.geometry.height > noPaddingChildrenHeight) {
                var dyOffset = (element.geometry.height - noPaddingChildrenHeight) / 2;
                _.each(childrenLayoutAreas, function(childLayoutArea) {
                    childLayoutArea.dy += dyOffset;
                });
            }

            layoutArea.height = Math.max(layoutArea.height, childrenHeight);
            layoutArea.width += childrenWidth;

            heightByDir[direction] = childrenHeight;
            widthByDir[direction] = childrenWidth;
        });

        // Balance left and right sub-trees (central element)
        if (heightByDir.L > 0 && heightByDir.R > 0) {
            var maxHeight = _.max(heightByDir);
            this.shiftLayoutAreas(childrenLayoutAreasByDir.L, (maxHeight - heightByDir.L) / 2, 'dy');
            this.shiftLayoutAreas(childrenLayoutAreasByDir.R, (maxHeight - heightByDir.R) / 2, 'dy');
        }

        if (widthByDir.L > 0) {
            // Shift right sub-tree by left sub-tree width
            this.shiftLayoutAreas(childrenLayoutAreasByDir.R, widthByDir.L, 'dx');
            // recalculate dx for the opposite rank
            _.each(childrenLayoutAreasByDir.L, function(childLayoutArea) {
                childLayoutArea.dx -= layoutArea.width - childLayoutArea.width - (widthByDir.R || 0);
                childLayoutArea.dx *= -1;
            });
        }

        layoutArea.leftRankWidth = widthByDir.L || 0;
        layoutArea.rightRankWidth = widthByDir.R || 0;
        element.layoutArea = layoutArea;

        return layoutArea;
    },

    // @private
    // Shift all given layout areas by the given distance and direction
    shiftLayoutAreas: function(layoutAreas, distance, coordinate) {
        distance && _.each(layoutAreas, function(layoutArea) { layoutArea[coordinate] += distance; });
    },

    // @private
    // Recursively sets position to all descendants elements of element{id}
    positionElements: function(id, initialPosition) {

        var indexByDir = { L: 0, R: 0 };

        initialPosition || this.setElementPosition(id);
        this.readElementPosition(id);
        this.positionCallouts(id);

        _.each(this.getChildrenOf(id), function(childId) {
            var child = this.elements[childId];
            child.siblingRank = ++indexByDir[child.rankDir];
            this.positionElements(childId, false);
        }, this);
    },

    // @private
    // Recursively sets position to all descendants links of element{id}
    positionLinks: function(id) {

        var source = this.elements[id];

        _.each(this.getChildrenOf(id), function(targetId) {

            var target = this.elements[targetId];
            var link = this.graph.getCell(target.parentLinkId);
            this.setVertices(link, source, target);
            this.positionLinks(targetId);

        }, this);
    },

    // @private
    // Recursively sets position to all descendants of callout{id}
    positionCallouts: function(id) {

        _.each(this.elements[id].callouts, function(calloutId) {
            this.setCalloutPosition(calloutId);
            this.positionElements(calloutId, true);
            this.positionLinks(calloutId);
        }, this);
    },

    // @private
    // Sets element position based on its layout area.
    setElementPosition: function(id) {

        var element = this.elements[id];
        var parentLayoutArea = this.elements[element.parentId].layoutArea;
        var childrenHeight = element.layoutArea.height + element.layoutArea.topPadding - element.layoutArea.bottomPadding;
        var position = {
            x: parentLayoutArea.x + element.layoutArea.dx,
            y: parentLayoutArea.y + element.layoutArea.dy + (childrenHeight  - element.geometry.height) / 2
        };

        if (element.rankDir == this.RANK_LEFT) {
            position.x += element.layoutArea.width - element.geometry.width;
        }

        this.graph.getCell(id).set({ position: position, siblingRank: element.siblingRank });
    },

    // @private
    // Computes missing element geometry.
    readElementPosition: function(id) {

        var element = this.elements[id];
        var position = this.graph.getCell(id).position();

        element.geometry.x = position.x;
        element.geometry.y = position.y;
        element.geometry.cx = position.x + element.geometry.width / 2;
        element.geometry.cy = position.y + element.geometry.height / 2;
        element.layoutArea.x = position.x - element.layoutArea.leftRankWidth;
        element.layoutArea.y = position.y - (element.layoutArea.height - element.layoutArea.bottomPadding + element.layoutArea.topPadding - element.geometry.height) / 2;
    },

    // @private
    // Sets callout position based on the caller layout area, cdy|cdx and direction
    setCalloutPosition: function(id) {

        var callout = this.elements[id];
        var caller = this.elements[callout.callerId];
        var x = caller.geometry.x;
        var y = caller.layoutArea.y;

        x += (caller.rankDir == this.RANK_LEFT)
            ? caller.geometry.width - callout.geometry.width - callout.cdx
            : callout.cdx;

        if (callout.cdy > 0) {
            y += caller.layoutArea.height;
            y += callout.cdy + (callout.layoutArea.height - callout.geometry.height + callout.layoutArea.topPadding - callout.layoutArea.bottomPadding) / 2;
            y -= caller.layoutArea.bottomPadding;
        } else {
            y += caller.layoutArea.topPadding;
            y += callout.cdy - (callout.layoutArea.height + callout.geometry.height - callout.layoutArea.topPadding + callout.layoutArea.bottomPadding) / 2;
        }

        this.graph.getCell(id).position(x, y);
    },

    // @private
    // Sets link vertices based on its source and target position
    setVertices: function(link, source, target) {

        // Add vertices only for non-perpendicular links
        if (target.geometry.cy != source.geometry.cy) {

            var x = source.geometry.x;
            x += (target.rankDir == this.RANK_LEFT)
                ? target.geometry.x + target.geometry.width + target.offsetx
                : target.geometry.x + source.geometry.width - target.offsetx;
            x /= 2;

            var vertices = [{ x: x, y: source.geometry.cy }, { x: x, y: target.geometry.cy }];
        }

        link.set('vertices', vertices || []);
    },

    // Utility
    // =======

    // @private
    benchmark: function(method) {

        var start = new Date().getTime();
        var res = this[method].apply(this, _.rest(arguments));
        this.get('benchmark') && console.log(method + ' time', new Date().getTime() - start, 'ms.');
        return res;
    }

});
