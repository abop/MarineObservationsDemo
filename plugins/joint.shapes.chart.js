//      JointJS library (http://jointjs.com)
//      (c) 2011-2014 client IO. http://client.io.


if (typeof exports === 'object') {

    var joint = {
        util: require('../src/core').util,
        shapes: {},
        dia: {
            Element: require('../src/joint.dia.element').Element
        }
    };
    var _ = require('lodash');
}


joint.shapes.chart = {};


joint.shapes.chart.Plot = joint.shapes.basic.Generic.extend({

    markup: [
        '<clipPath class="clip"><rect/></clipPath>',
        '<g class="rotatable">',
        '<g class="scalable"></g>',
        '<g class="background"><rect/><text/></g>',
        '<g class="axis">',
        '<g class="y-axis"><path/><g class="ticks"></g></g>',
        '<g class="x-axis"><path/><g class="ticks"></g></g>',
        '<g class="markings"></g>',
        '</g>',
        '<g class="data"><g class="series"></g></g>',
        '<g class="foreground">',
        '<rect/><text class="caption"/><text class="subcaption"/>',
        '<g class="legend"><g class="legend-items"></g></g>',
        '<line class="guideline x-guideline" /><line class="guideline y-guideline" />',
        '</g>',
        '</g>'
    ].join(''),
    tickMarkup: '<g class="tick"><line/><text/></g>',
    pointMarkup: '<g class="point"><circle/><text/></g>',
    barMarkup: '<path class="bar"/>',
    markingMarkup: '<g class="marking"><rect/><text/></g>',
    serieMarkup: '<g><clipPath class="serie-clip"><rect/></clipPath><path/><g class="bars"></g><g class="points"></g></g>',
    legendItemMarkup: '<g class="legend-item"><circle/><text/></g>',
    
    defaults: joint.util.deepSupplement({
    
        type: 'chart.Plot',
        attrs: {
            '.data path': { fill: 'none', stroke: 'black' },
            '.data .bars rect': { fill: 'none', stroke: 'black' },
            '.background rect': { fill: 'white', stroke: '#e5e5e5', opacity: 1 },
            '.background text': { fill: 'black', text: 'No data available.', ref: '.', 'ref-x': .5, 'ref-y': .5, 'text-anchor': 'middle', 'y-alignment': 'middle', display: 'none' },
            '.foreground > rect': { fill: 'white', stroke: '#e5e5e5', opacity: 0, 'pointer-events': 'none' },
            '.foreground .caption': { fill: 'black', text: '', ref: '.foreground > rect', 'ref-x': .5, 'ref-y': 10, 'text-anchor': 'middle', 'y-alignment': 'middle', 'font-size': 14 }, 
            '.foreground .subcaption': { fill: 'black', text: '', ref: '.foreground > rect', 'ref-x': .5, 'ref-y': 23, 'text-anchor': 'middle', 'y-alignment': 'middle', 'font-size': 10 },
            '.point': { display: 'inline-block' },
            '.point circle': { r: 2, stroke: 'black', fill: 'black', 'opacity': .3 },
            '.point text': { fill: 'black', 'font-size': 8, 'text-anchor': 'middle', display: 'none' },
            '.axis path': { fill: 'none', stroke: 'black' },
            '.axis .tick': { fill: 'none', stroke: 'black' },
            '.y-axis .tick line': { fill: 'none', stroke: 'black', x2: 2, y2: 0, opacity: 1 },
            '.x-axis .tick line': { fill: 'none', stroke: 'black', x2: 0, y2: -3, opacity: 1 },
            '.y-axis .tick text': { fill: 'black', stroke: 'none', 'font-size': 10, dy: '-.5em', x: -5, 'text-anchor': 'end' },
            '.x-axis .tick text': { fill: 'black', stroke: 'none', 'font-size': 10, dy: '.5em', x: 0, 'text-anchor': 'middle' },
            '.axis .markings': { fill: 'black', stroke: 'none', 'fill-opacity': 1 },
            '.axis .markings text': { fill: 'black', 'text-anchor': 'end', 'font-size': 10, dy: -5, dx: -5 },
            '.guideline': { 'pointer-events': 'none', display: 'none' },
            '.x-guideline': { stroke: 'black', visibility: 'hidden' },
            '.y-guideline': { stroke: 'black', visibility: 'hidden' },
            '.legend': { ref: '.background', 'ref-x': 10, 'ref-y': 10 },
            '.legend-item text': { fill: 'black', transform: 'translate(14, 0)', 'font-size': 11 },
            '.legend-item circle': { r: 5, transform: 'translate(5,5)' },
            '.legend-item': { cursor: 'pointer' },
            '.legend-item.disabled circle': { fill: 'gray' },
            '.legend-item.disabled text': { opacity: .5 }
        }
        
    }, joint.shapes.basic.Generic.prototype.defaults),

    legendPosition: function(pos, opt) {

        opt = opt || {};
        
        this.trigger('batch:start');

        // Clean up previous attributes first. Do it silently so that we don't unncessarilly trigger updates.
        this.removeAttr(['.legend/ref-x', '.legend/ref-y', '.legend/ref-dx', '.legend/ref-dy', '.legend/x-alignment', '.legend/y-alignment'], { silent: true });

        var padding = opt.padding || 10;
        
        var attrs = {

            n: { '.legend': { 'ref-x': .5, 'x-alignment': -.5, 'ref-y': padding } },
            ne: { '.legend': { 'ref-dx': -padding, 'x-alignment': -.999, 'ref-y': padding } },
            e: { '.legend': { 'ref-dx': -padding, 'x-alignment': -.999, 'ref-y': .5, 'y-alignment': -.5 } },
            se: { '.legend': { 'ref-dx': -padding, 'ref-dy': -padding, 'x-alignment': -.999, 'y-alignment': -.999 } },
            s: { '.legend': { 'ref-x': .5, 'ref-dy': -padding, 'x-alignment': -.5, 'y-alignment': -.999 } },
            sw: { '.legend': { 'ref-x': padding, 'ref-dy': -padding, 'y-alignment': -.999 } },
            w: { '.legend': { 'ref-x': padding, 'ref-y': .5, 'y-alignment': -.5 } },
            nw: { '.legend': { 'ref-x': padding, 'ref-y': padding } },
            nnw: { '.legend': { 'ref-x': padding, 'ref-y': -padding, 'y-alignment': -.999 } },
            nn: { '.legend': { 'ref-x': .5, 'ref-y': -padding, 'x-alignment': -.5, 'y-alignment': -.999 } },
            nne: { '.legend': { 'ref-dx': -padding, 'ref-y': -padding, 'x-alignment': -.999, 'y-alignment': -.999 } },
            nnee: { '.legend': { 'ref-dx': padding, 'ref-y': -padding, 'y-alignment': -.999 } },
            nee: { '.legend': { 'ref-y': padding, 'ref-dx': padding } },
            ee: { '.legend': { 'ref-dx': padding, 'ref-y': .5, 'y-alignment': -.5 } },
            see: { '.legend': { 'ref-dx': padding, 'ref-dy': -padding, 'y-alignment': -.999 } },
            ssee: { '.legend': { 'ref-dx': padding, 'ref-dy': padding } },
            sse: { '.legend': { 'ref-dx': -padding, 'ref-dy': padding, 'x-alignment': -.999 } },
            ss: { '.legend': { 'ref-x': .5, 'ref-dy': padding, 'x-alignment': -.5 } },
            ssw: { '.legend': { 'ref-x': padding, 'ref-dy': padding } },
            ssww: { '.legend': { 'ref-x': -padding, 'ref-dy': padding, 'x-alignment': -.999 } },
            sww: { '.legend': { 'ref-x': -padding, 'ref-dy': -padding, 'x-alignment': -.999, 'y-alignment': -.999 } },
            ww: { '.legend': { 'ref-x': -padding, 'ref-y': .5, 'x-alignment': -.999, 'y-alignment': -.5 } },
            nww: { '.legend': { 'ref-x': -padding, 'ref-y': padding, 'x-alignment': -.999 } },
            nnww: { '.legend': { 'ref-x': -padding, 'ref-y': -padding, 'x-alignment': -.999, 'y-alignment': -.999 } }
        };

        if (attrs[pos]) {
            this.attr(attrs[pos]);
        }

        this.trigger('batch:stop');
    },

    // Add point `p` as the last point to the serie identified by `serieName`. If `opt.maxLen` is set and
    // the number of points in the serie is higher than `maxLen`, shift the data in the serie.
    addPoint: function(p, serieName, opt) {

        opt = opt || {};

        var series = this.get('series');
        
        var serieIndex = _.findIndex(series, { name: serieName });
        if (serieIndex === -1) {
            throw new Error('Serie ' + serieName + ' was not found.');
        }

        // Clone the serie so that the normal Backbone mechanism for `set()` and `prev()` works as expected.
        var serie = _.cloneDeep(series[serieIndex]);
        serie.data.push(p);

        if (_.isFinite(opt.maxLen) && serie.data.length > opt.maxLen) {

            serie.data.shift();
        }

        // Again, slice the array so that we don't alter the `series` array currently set.
        series = series.slice();
        series[serieIndex] = serie;
        
        this.set('series', series, opt);
    },

    // Return the last point in the serie identified by `serieName`.
    lastPoint: function(serieName) {

        return _.last(_.findWhere(this.get('series'), { name: serieName }).data);
    },

    // Return the first point in the serie identified by `serieName`.
    firstPoint: function(serieName) {

        return _.first(_.findWhere(this.get('series'), { name: serieName }).data);
    }
});

joint.shapes.chart.PlotView = joint.dia.ElementView.extend({

    events: {

        'mousemove': 'onMouseMove',
        'mouseout': 'onMouseOut'
    },

    initialize: function() {
        
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:series change:interpolate change:padding change:canvas change:markings change:axis', _.bind(function() { this.update(); }, this));

        this.on('cell:pointerdown', this.onPointerDown, this);

        // A list of disabled serie names. This is used when toggling series via the legend
        // or programmatically.
        this._disabledSeries = [];
    },

    renderMarkup: function() {

        joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments);

        // Cache important elements for faster access.
        this.elDataClipPath = this.$('.clip')[0];
        this.elDataClipPathRect = this.elDataClipPath.firstChild;
        this.elBackgroundRect = this.$('.background rect')[0];
        this.elBackgroundText = this.$('.background text')[0];
        this.elForeground = this.$('.foreground')[0];
        this.elForegroundRect = this.$('.foreground rect')[0];
        this.elDataSeries = this.$('.data .series')[0];
        this.elYAxisPath = this.$('.y-axis path')[0];
        this.elYAxisTicks = this.$('.y-axis .ticks')[0];
        this.elXAxisPath = this.$('.x-axis path')[0];
        this.elXAxisTicks = this.$('.x-axis .ticks')[0];
        this.elMarkings = this.$('.axis .markings')[0];
        this.elXGuideline = this.$('.x-guideline')[0];
        this.elYGuideline = this.$('.y-guideline')[0];
        this.elLegend = this.$('.legend')[0];
        this.elLegendItems = this.$('.legend-items')[0];

        // An SVG element for repeatable elements. This will be used as an original for future clones.
        this.elTick = V(this.model.tickMarkup);
        this.elMarking = V(this.model.markingMarkup);
        this.elLegendItem = V(this.model.legendItemMarkup);
        this.elPoint = V(this.model.pointMarkup);
        this.elBar = V(this.model.barMarkup);
        this.elSerie = V(this.model.serieMarkup);
        
        // Create clip region for the chart area and for the markings as they could also be out
        // of the clip region.
        this.elDataClipPath.id = 'clip_' + this.cid;
        V(this.$('.data')[0]).attr('clip-path', 'url(#' + this.elDataClipPath.id + ')');
        V(this.elMarkings).attr('clip-path', 'url(#' + this.elDataClipPath.id + ')');
    },

    update: function(series) {

        series = this.filterSeries(series);

        // Get statistics about the series.
        this.calculateStats(series);
        
        var size = this.model.get('size');
        var width = size.width;
        var height = size.height;

        // Chart area.
        this.canvas = _.extend({
            x: 0, y: 0,
            width: width, height: height
        }, this.model.get('canvas'));

        // Padding. In theory, padding is not necessary as one can always set the canvas area
        // directly. However, it is much more convenient to be able to set a padding only for
        // a specific dimension(s) (top/right/bottom/left) and let the canvas alone.
        // Note that it is always advisable to set `padding` for bar charts, otherwise
        // some of the bars (or their parts - depending on the `align` option) won't be visible.
        var padding;
        var defaultPadding = { top: 0, right: 0, bottom: 0, left: 0 };
        var modelPadding = this.model.get('padding');
        if (_.isObject(modelPadding)) {
            
            padding = _.extend({}, defaultPadding, modelPadding);
            
        } else if (!_.isUndefined(modelPadding)) {
            // The padding is assumed to be a number. In this case, compensate for the right/bottom coordinates
            // automatically. So that if e.g. `padding` is `10`, the chart area is moved `10px` from the left
            // and the width becomes `2*10px` less so that there is also `10px` padding from the right.
            padding = { top: modelPadding, right: 2*modelPadding, bottom: 2*modelPadding, left: modelPadding };
            
        } else {

            padding = defaultPadding;
        }
        
        this.canvas = g.rect(this.canvas).moveAndExpand(g.rect(padding.left, padding.top, -padding.right, -padding.bottom));

        var viewRect = { x: 0, y: 0, width: width, height: height };
        
        V(this.elDataClipPathRect).attr(viewRect);
        V(this.elBackgroundRect).attr(viewRect);
        V(this.elForegroundRect).attr(viewRect);


        this.updateAxis();
        this.updateMarkings();

        if (this.isEmpty()) {
            // No data available.
            // Show the "No data available" label that is hidden by default.
            $(this.elBackgroundText).show();
            
        } else {
        
            $(this.elBackgroundText).hide();
        }

        this.updateSeries(series);

        this.updateLegend();

        // Apply attrs.
        joint.dia.ElementView.prototype.update.apply(this, arguments);
    },

    calculateStats: function(series) {

        series = series || this.model.get('series');

        var xValues = [];
        var yValues = [];
        // `xMap` maps x values to an array of series these x values appear in and the corresponding
        // y values. This is useful when we want to, for a given x value, retriev all the corresponding
        // y values from all the series this x value appeared in (especially useful in tooltips).
        var xMap = {};
        var yMap = {};

        var bySerie = {};

        _.each(series, function(serie, idx) {

            var stats = bySerie[serie.name || idx] || (bySerie[serie.name || idx] = {});

            // Initial assumptions.
            stats.decreasingX = true;
            stats.decreasingY = true;
            stats.nonDecreasingX = true;
            stats.nonDecreasingY = true;

            var prev;   // Previous data point.
            
            _.each(serie.data, function(dp) {

                stats.minX = _.isUndefined(stats.minX) ? dp.x : Math.min(stats.minX, dp.x);
                stats.maxX = _.isUndefined(stats.maxX) ? dp.x : Math.max(stats.maxX, dp.x);
                stats.minY = _.isUndefined(stats.minY) ? dp.y : Math.min(stats.minY, dp.y);
                stats.maxY = _.isUndefined(stats.maxY) ? dp.y : Math.max(stats.maxY, dp.y);

                if (prev) {
                    stats.decreasingX = stats.decreasingX && dp.x < prev.x;
                    stats.decreasingY = stats.decreasingY && dp.y < prev.y;
                    stats.nonDecreasingX = stats.nonDecreasingX && dp.x >= prev.x;
                    stats.nonDecreasingY = stats.nonDecreasingY && dp.y >= prev.y;
                }

                if (!_.contains(xValues, dp.x)) xValues.push(dp.x);
                if (!_.contains(yValues, dp.y)) yValues.push(dp.y);

                (xMap[dp.x] || (xMap[dp.x] = [])).push({ serie: serie, x: dp.x, y: dp.y });
                (yMap[dp.y] || (yMap[dp.y] = [])).push({ serie: serie, x: dp.x, y: dp.y });

                prev = dp;
            });
        });

        var axis = this.model.get('axis') || {};
        var xAxis = axis['x-axis'] || {};
        var yAxis = axis['y-axis'] || {};

        this.stats = {
            minX: _.isUndefined(xAxis.min) ? _.min(xValues) : xAxis.min,
            maxX: _.isUndefined(xAxis.max) ? _.max(xValues) : xAxis.max,
            minY: _.isUndefined(yAxis.min) ? _.min(yValues) : yAxis.min,
            maxY: _.isUndefined(yAxis.max) ? _.max(yValues) : yAxis.max,
            bySerie: bySerie,
            xValues: xValues,
            yValues: yValues,
            xMap: xMap,
            yMap: yMap
        };
    },

    isEmpty: function() {
        
        return !this.stats.xValues.length;
    },

    updateSeries: function(series) {

        series = series || this.model.get('series');

        // Remove all the previously rendered series.
        this.elDataSeries.textContent = '';

        if (this.isEmpty()) return;
        
        var xDomain = [this.stats.minX, this.stats.maxX];
        var yDomain = [this.stats.minY, this.stats.maxY];
        var xRange = [this.canvas.x, this.canvas.x + this.canvas.width];
        // Note how the `yRange` is inverted. This is because we render points from bottom to top.
        var yRange = [this.canvas.y + this.canvas.height, this.canvas.y];

        var attrs = this.model.get('attrs');

        _.each(series, function(serie, i) {

            var points = serie.data;
            var transformedPoints = [];

            var elSerie = this.elSerie.clone().attr('class', serie.name || ('serie-' + i));
            V(this.elDataSeries).append(elSerie);
            
            _.each(points, function(p) {

                // Transform the data point to the chart area.
                var x = g.scale.linear(xDomain, xRange, p.x);
                var y = g.scale.linear(yDomain, yRange, p.y);

                transformedPoints.push({ x: x, y: y });

                // Set position of the point element circle and label.
                // A little optimization: do not render the points if they're not turned on.
                if (attrs['.point'] && attrs['.point'].display !== 'none') {

                    this.renderPoint(p, serie);
                }

                if (serie.bars) {

                    this.renderBar(p, serie);
                }

            }, this);

            // Clip the serie path in order to clip the helper continuation of the path
            // that is used to close the path for filling. (see `fixPathForFill()`).
            var elSeriePathClip = elSerie.findOne('.serie-clip');

            var size = this.model.get('size');
            var stats = this.stats.bySerie[serie.name || i];
            var minX = g.scale.linear(xDomain, xRange, stats.minX);
            var maxX = g.scale.linear(xDomain, xRange, stats.maxX);

            var elSeriePathClipRect = elSeriePathClip.findOne('rect');
            elSeriePathClipRect.attr(g.rect(minX, 0, maxX - minX, size.height));

            if (!serie.bars) {
                // Bars were already rendered for each data point.
                
                var elSeriePath = elSerie.findOne('path');
                elSeriePath.attr({
                    d: this.seriePathData(transformedPoints, serie, i),
                    'clip-path': 'url(#' + elSeriePathClip.node.id + ')'
                });
            }
            
        }, this);
    },

    seriePathClipData: function(points, serie) {

        var padding = 10;

        var size = this.model.get('size');
        var firstPoint = _.first(points);
        var lastPoint = _.last(points);
        
        var d = ['M', firstPoint.x, firstPoint.y, 'V', size.height + padding];
        return d.join(' ');
    },

    renderBar: function(p, serie) {

        var xDomain = [this.stats.minX, this.stats.maxX];
        var yDomain = [this.stats.minY, this.stats.maxY];
        var xRange = [this.canvas.x, this.canvas.x + this.canvas.width];
        // Note how the `yRange` is inverted. This is because we render points from bottom to top.
        var yRange = [this.canvas.y + this.canvas.height, this.canvas.y];

        // Transform the data point to the chart area.
        var x = g.scale.linear(xDomain, xRange, p.x);
        var y = g.scale.linear(yDomain, yRange, p.y);

        var definedBarWidth = serie.bars.barWidth || .8;
        var barWidth = definedBarWidth > 1 ? definedBarWidth : (this.canvas.width / (this.stats.maxX - this.stats.minX)) * definedBarWidth;
        var barHeight = g.scale.linear(yDomain, yRange, 0) - y;

        // `rx` values can be defined either directly in the data point for a specific bar
        // or on the `serie` object for all the bars.
        var topRx = p['top-rx'] || serie.bars['top-rx'];
        var topRy = p['top-ry'] || serie.bars['top-ry'];
        var bottomRx = p['bottom-rx'] || serie.bars['bottom-rx'];
        var bottomRy = p['bottom-ry'] || serie.bars['bottom-ry'];

        // Alignment of the bar against the x coordinate. `'left'` is the default.
        var barX = ({
            
            'left': x,
            'middle': x - barWidth/2,
            'right': x - barWidth
            
        })[serie.bars.align || 'middle'];
        
        var elBar = this.elBar.clone();
        elBar.attr({
            'data-serie': serie.name,
            'data-x': p.x,
            'data-y': p.y,
            d: V.rectToPath({ x: barX, y: y, width: barWidth, height: barHeight, 'top-rx': topRx, 'top-ry': topRy, 'bottom-rx': bottomRx, 'bottom-ry': bottomRy })
        });

        var serieSelector = serie.name || ('serie-' + this.model.get('series').indexOf(serie));
        V(this.elDataSeries).findOne('.' + serieSelector + ' .bars').append(elBar);
        
        return elBar.node;
    },
    
    renderPoint: function(p, serie) {

        var xDomain = [this.stats.minX, this.stats.maxX];
        var yDomain = [this.stats.minY, this.stats.maxY];
        var xRange = [this.canvas.x, this.canvas.x + this.canvas.width];
        // Note how the `yRange` is inverted. This is because we render points from bottom to top.
        var yRange = [this.canvas.y + this.canvas.height, this.canvas.y];

        // Transform the data point to the chart area.
        var x = g.scale.linear(xDomain, xRange, p.x);
        var y = g.scale.linear(yDomain, yRange, p.y);

        var elPoint = this.elPoint.clone();
        elPoint.attr({
            'data-serie': serie.name,
            'data-x': p.x,
            'data-y': p.y
        });
        elPoint.findOne('circle').attr({ cx: x, cy: y });
        elPoint.findOne('text').attr({ x: x, dy: y }).text(this.pointLabel(p, serie));

        var serieSelector = serie.name || ('serie-' + this.model.get('series').indexOf(serie));
        V(this.elDataSeries).findOne('.' + serieSelector + ' .points').append(elPoint);
        
        return elPoint.node;
    },

    // Construct an SVG path for the data points. Use interpolation if desired.
    seriePathData: function(points, serie, idx) {

        var interpolate = _.isUndefined(serie.interpolate) ? this.model.get('interpolate') : serie.interpolate;
        var d;
        var i;
        var p;
        var pointsLength = points.length;

        switch (interpolate) {
            
          case 'bezier':
            d = g.bezier.curveThroughPoints(points);
            break;

          case 'step':
            p = points[0];
            d = ['M', p.x, p.y];
            for (i = 1; i < pointsLength; i++) {
                d.push('H', (p.x + points[i].x)/2, 'V', points[i].y);
                p = points[i];
            }
            break;

          case 'stepBefore':
            d = ['M', points[0].x, points[0].y];
            for (i = 1; i < pointsLength; i++) {
                d.push('V', points[i].y, 'H', points[i].x);
            }
            break;

          case 'stepAfter':
            d = ['M', points[0].x, points[0].y];
            for (i = 1; i < pointsLength; i++) {
                d.push('H', points[i].x, 'V', points[i].y);
            }
            break;

        default:        // linear
            d = ['M'];
            for (i = 0; i < pointsLength; i++) {
                d.push(points[i].x, points[i].y);
            }
            break;
        }

        d = this.fixPathForFill(d, points, serie, idx);
        
        return d.join(' ');
    },

    fixPathForFill: function(d, points, serie, idx) {

        // Nothing needs to be fixed for empty points list.
        if (points.length === 0) return d;
        
        // If the serie is not non-decreasing (it is an arbitrary function), it is assumed that
        // the author knows what he's doing and handles proper fill himself.
        var stats = this.stats.bySerie[serie.name || idx];
        if (!stats.nonDecreasingX) return d;
        
        var padding = 10;
        var size = this.model.get('size');
        var firstPoint = _.first(points);
        var lastPoint = _.last(points);        

        // Start a subpath at the level of the last point of the serie but below the visible chart area
        // (i.e. below the clipped region) and continue that path to the level of the first point circling
        // around the bottom of the clipping region. This makes sure that even though the serie
        // has its last x point before another serie in the chart and fill is set on the serie SVG path element
        // the fill will properly fill the region below the serie path. This is nicely visible
        // if you comment out the setting of the `clip-path` attribute on the `.data` group.
        var dPrefix = ['M', lastPoint.x, size.height + padding, 'H', firstPoint.x - padding, 'V', firstPoint.y];
        // The first path command is assumed to be `'M'`. Due to the trick
        // to fully support a proper fill, there is already preceeding a subpath.
        // Therefore, we want to continue that subpath with a line command.
        d[0] = 'L';
        
        return dPrefix.concat(d);
    },

    updateAxis: function() {

        var size = this.model.get('size');
        var width = size.width;
        var height = size.height;

        var axis = this.model.get('axis');

        // The canvas could be larger or smaller than the actual height of the chart view.
        // This can happen when the chart is zoomed. However, we still want to render the
        // axis along the height of the chart view (not continueing it below or above).
        // The `canvasHeighRatio` helps us adjust the range to which we map the values
        // from the axis domain.
        var canvasHeightRatio = this.canvas.height / height;
        var canvasWidthRatio = this.canvas.width / width;
        
        // Axis line.
        V(this.elYAxisPath).attr('d', ['M', 0, 0, 'L', 0, height].join(' '));
        V(this.elXAxisPath).attr('d', ['M', 0, height, 'L', width, height].join(' '));

        // Clean up old ticks.
        this.elXAxisTicks.textContent = '';
        this.elYAxisTicks.textContent = '';

        if (this.isEmpty()) return;

        var xDomain = [this.stats.minX, this.stats.maxX];
        var yDomain = [this.stats.minY, this.stats.maxY];
        var xRange = [this.canvas.x, this.canvas.x + this.canvas.width];
        var yRange = [0, this.canvas.height];
        var xDomainSpan = xDomain[1] - xDomain[0];
        var yDomainSpan = yDomain[1] - yDomain[0];
        
        var yAxis = axis && axis['y-axis'] || {};
        var xAxis = axis && axis['x-axis'] || {};

        // Number of ticks. If the length of the domain interval is zero, show at least one tick.
        var ticks = (yDomainSpan) > 0 ? (yAxis.ticks - 1 || 10) : 0;
        // A tick step. We must scale the tick step down by the `canvasHeightRatio`.
        // The tick step becomes smaller if the canvas is larger than the chart view and bigger otherwise.
        var tickStep = (yDomainSpan / ticks) / canvasHeightRatio;
        
        // Render ticks.
        // Start at `yDomain[0]` and step by `tickStep` `ticks` number of times.
        var y = yDomain[0];
        _.each(_.range(ticks + 1), function(i) {

            var ty = g.scale.linear(yDomain, yRange, y);
            
            var elTick = this.elTick.clone();
            elTick.translate(0, ty);
            V(this.elYAxisTicks).append(elTick);

            // Invert the `y` value according to the domain as we're moving from top to bottom but
            // the axis ticks are labeled from bottom to top.
            var tickValue = yDomain[1] - (y - yDomain[0]);
            // The `tickValue` is shifted by the `canvas.y` offset but first we must scale this offset
            // back to the domain of the axis.
            tickValue += g.scale.linear(yRange, yDomain, this.canvas.y) - yDomain[0];

            elTick.findOne('text').text(this.tickLabel(tickValue, yAxis));

            y += tickStep;
            
        }, this);

        _.each(this.stats.xValues, function(x, i) {

            // Show only every `tickStep` value. Default is to show all the `x` values.
            if (i % (xAxis.tickStep || 1) !== 0) return;

            var tx = g.scale.linear(xDomain, xRange, x);

            // Do not show ticks that are outside the chart view area.
            if (tx > width) return;
            
            var elTick = this.elTick.clone();
            elTick.translate(tx, height);
            V(this.elXAxisTicks).append(elTick);

            elTick.findOne('text').text(this.tickLabel(x, xAxis));
            
        }, this);
    },

    tickLabel: function(value, opt) {

        if (_.isFunction(opt.tickFormat)) {
            
            return opt.tickFormat(value);
        }
        
        var formatSpecifier = opt.tickFormat || '.1f';
        var label = joint.util.format.number(formatSpecifier, value);
        return label + (_.isFunction(opt.tickSuffix) ? opt.tickSuffix(value) : (opt.tickSuffix || ''));
    },

    pointLabel: function(p, opt) {
        
        if (_.isFunction(opt.pointFormat)) {
            
            return opt.pointFormat(p);
        }
        
        var formatSpecifier = opt.pointFormat || '.1f';
        var label = joint.util.format.number(formatSpecifier, p.y);
        return label + (opt.pointSuffix || '');
    },

    updateMarkings: function() {

        // Clean up old markings.
        this.elMarkings.textContent = '';

        var markings = this.model.get('markings');
        // No need to continue if there are no markings.
        if (!markings || markings.length === 0) return;

        var size = this.model.get('size');
        var width = size.width;
        var height = size.height;

        var xDomain = [this.stats.minX, this.stats.maxX];
        var yDomain = [this.stats.minY, this.stats.maxY];
        var xRange = [this.canvas.x, this.canvas.x + this.canvas.width];
        var yRange = [this.canvas.y, this.canvas.y + this.canvas.height];

        function firstDefined(a, b) {
            return _.isUndefined(a) ? b : a;
        }
        
        _.each(markings, function(marking, i) {

            // Start and end of the marking. The following adjustments makes it
            // easier to define the marking. It does not really matter if the `end`
            // is before `start`. Also, if the only thing defined is `start.y`, the marking
            // will be a single line starting at that `y` position crossing the whole chart.
            var start = marking.start || marking.end;
            var end = marking.end || marking.start;

            var startX = Math.min(firstDefined(start.x, this.stats.minX), firstDefined(end.x, this.stats.minX));
            var endX = Math.max(firstDefined(start.x, this.stats.maxX), firstDefined(end.x, this.stats.maxX));
            var startY = Math.min(firstDefined(start.y, this.stats.minY), firstDefined(end.y, this.stats.minY));
            var endY = Math.max(firstDefined(start.y, this.stats.maxY), firstDefined(end.y, this.stats.maxY));

            // Scale `start` and `end` to use for translating the marking rectangle.

            // If the marking is a trendline, i.e. one of the coordinates is missing,
            // (in other words the marking is not an area), we want such line to
            // cover the whole view regardless of the canvas area. The reasoning behind
            // this is that, for example, if we have a bar chart and some of the bars
            // are rendered after the canvas area and we can compensate for this by
            // setting a padding on the canvas area, we still want the trendlines
            // to be rendered for those bars.
            var isTrendLineX = _.isUndefined(start.x) || _.isUndefined(end.x);
            var isTrendLineY = _.isUndefined(start.y) || _.isUndefined(end.y);

            if (isTrendLineX) xRange = [0, width];
            if (isTrendLineY) yRange = [0, height];
            
            var startTx = g.scale.linear(xDomain, xRange, startX);
            var endTx = g.scale.linear(xDomain, xRange, endX);
            var startTy = g.scale.linear(yDomain, yRange, startY);
            var endTy = g.scale.linear(yDomain, yRange, endY);

            // Marking position and dimensions.
            var mx = startTx;
            var my = yRange[1] - endTy + yRange[0];
            var mw = endTx - startTx;
            var mh = endTy - startTy;

            // Limit the marking to the bounding box of the canvas.
            //if (mx + mw > this.canvas.width + this.canvas.x) mw = this.canvas.width + this.canvas.x - mx;
            //if (my + mh > this.canvas.height + this.canvas.y) mh = this.canvas.height + this.canvas.y - my;

            // Make sure we give the marking a positive width and height, otherwise it's not visible at all.
            mw = Math.max(mw, 1);
            mh = Math.max(mh, 1);

            // Render the marking.
            var elMarking = this.elMarking.clone();
            elMarking.findOne('rect').attr({ x: mx, y: my, width: mw, height: mh });
            elMarking.findOne('text').text(marking.label || '').attr({ x: mx + mw, y: my });
            var className = elMarking.attr('class') + ' ' + (marking.name || ('marking-' + i));
            elMarking.attr(_.extend({ 'class': className }, marking.attrs));
            V(this.elMarkings).append(elMarking);
            
        }, this);
    },

    updateLegend: function() {

        var series = this.model.get('series');

        this.elLegendItems.textContent = '';
        
        _.each(series, function(serie, i) {

            // Give the outside world the ability to decide whether a legend item should be shown or not.
            if (_.isFunction(serie.showLegend) && !serie.showLegend(serie, this.stats.bySerie[serie.name || i])) {

                return;

            } else if (serie.showLegend === false) {

                return;
            }

            var elLegendItem = this.elLegendItem.clone();
            if (_.contains(this._disabledSeries, serie.name)) {
                elLegendItem.addClass('disabled');
            }
            elLegendItem.attr('data-serie', serie.name);
            elLegendItem.findOne('circle').attr({ fill: this.getSerieColor(serie.name) });
            elLegendItem.findOne('text').text(serie.label || serie.name);
            elLegendItem.translate(0, i * (serie.legendLabelLineHeight || 16));
            V(this.elLegendItems).append(elLegendItem);
            
        }, this);
    },

    getSerieColor: function(serieName) {

        var attrs = this.model.get('attrs');

        var serieAttrs = _.find(attrs, function(attr, selector) {

            if (_.contains(selector, serieName)) return true;
        });

        return serieAttrs ? serieAttrs.stroke || serieAttrs.fill : 'black';
    },

    hideSerie: function(serieName) {

        if (!_.contains(this._disabledSeries, serieName)) {
            this._disabledSeries.push(serieName);
        }

        var series = this.filterSeries();
        this.update(series);
    },

    showSerie: function(serieName) {

        this._disabledSeries = _.without(this._disabledSeries, serieName);

        var series = this.filterSeries();
        this.update(series);
    },

    filterSeries: function(series) {
        
        series = series || this.model.get('series');

        series = _.reject(series, function(serie) {
            return _.contains(this._disabledSeries, serie.name);
        }, this);

        return series;
    },

    // Interaction.
    // ------------

    onPointerDown: function(evt, x, y) {

        var elLegendItem = $(evt.target).closest('.legend-item')[0];
        if (elLegendItem) {

            V(elLegendItem).toggleClass('disabled');

            if (V(elLegendItem).hasClass('disabled')) {
                
                this.hideSerie(V(elLegendItem).attr('data-serie'));
                
            } else {
                
                this.showSerie(V(elLegendItem).attr('data-serie'));
            }
        }
    },

    onMouseMove: function(evt) {

        this.showGuidelines(evt.clientX, evt.clientY, evt);
    },

    onMouseOut: function(evt) {

        this.hideGuidelines();
        this.trigger('mouseout', evt);
    },
    
    showGuidelines: function(clientX, clientY, evt) {

        var angle = this.model.get('angle');
        var bbox = this.model.getBBox();
        var series = this.model.get('series');

        var localPoint = g.point(V(this.paper.viewport).toLocalPoint(clientX, clientY)).rotate(bbox.center(), angle);

        if (g.rect(bbox).containsPoint(localPoint)) {

            var size = this.model.get('size');

            var x = localPoint.x - bbox.x;
            var y = localPoint.y - bbox.y;

            V(this.elXGuideline).attr({ x1: x, y1: 0, x2: x, y2: size.height, visibility: 'visible' });
            V(this.elYGuideline).attr({ x1: 0, y1: y, x2: size.width, y2: y, visibility: 'visible' });

            var dataX = g.scale.linear([this.canvas.x, this.canvas.x + this.canvas.width], [this.stats.minX, this.stats.maxX], x);
            var dataY = g.scale.linear([this.canvas.y, this.canvas.y + this.canvas.height], [this.stats.minY, this.stats.maxY], y);

            var dataPoint = { x: dataX, y: this.stats.minY + this.stats.maxY - dataY };
            var clientPoint = { x: clientX, y: clientY };
            var closestPoints = this.closestPoints(dataX);
            
            this.trigger('mouseover', dataPoint, clientPoint, closestPoints, evt);
        }
    },

    // Return the closest points for a given `x` value. The returned array contains objects
    // with `x` and `y` values and a `serie` object this `x` value appeared in.
    closestPoints: function(x) {

        var xValuesIndex = _.sortedIndex(this.stats.xValues, x);
        
        var xValue = this.stats.xValues[xValuesIndex];
        var xValueBefore = this.stats.xValues[xValuesIndex - 1];

        var xClosest = _.isUndefined(xValueBefore) ? xValue : (Math.abs(x - xValue) < Math.abs(x - xValueBefore) ? xValue : xValueBefore);

        return this.stats.xMap[xClosest];
    },

    hideGuidelines: function() {
        
        V(this.elXGuideline).attr('visibility', 'hidden');
        V(this.elYGuideline).attr('visibility', 'hidden');
    }
});

joint.shapes.chart.Pie = joint.shapes.basic.Generic.extend({

    markup: [
        '<g class="rotatable">',
        '<g class="scalable"></g>',
        '<g class="background"><rect/><text/></g>',
        '<g class="data"></g>',
        '<g class="foreground">',
        '<rect/><text class="caption"/><text class="subcaption"/>',
        '<g class="legend"><g class="legend-items"></g></g>',
        '</g>',
        '</g>'
    ].join(''),

    sliceMarkup: '<g class="slice"/>',
    sliceFillMarkup: '<path class="slice-fill"/>',
    sliceBorderMarkup: '<path class="slice-border"/>',
    sliceInnerLabelMarkup: '<text class="slice-inner-label"/>',
    legendSerieMarkup: '<g class="legend-serie"><text/></g>',
    legendSliceMarkup: '<g class="legend-slice"><circle/><text/></g>',

    defaults: joint.util.deepSupplement({

        type: 'chart.Pie',
        size: { width: 200, height: 200 },

        // work only on first (or alone) serie
        pieHole: 0,

        // serieDefaults.startAngle: pie is draw clockwise from est (right)
        serieDefaults: {
            startAngle: 0,
            degree: 360,
            label: null,
            showLegend: true,
            labelLineHeight: 6
        },

        // onClickEffect/onHoverEffect: effect on click/mouseOver (see this.effectOnSlice for a list and option, ex. onHoverEffect: {type: 'enlarge', scale: 1.05})
        sliceDefaults: {
            innerLabel: '{percentage:.0f}%',
            innerLabelMargin: 6,
            legendLabel: '{label}: {value}',
            legendLabelLineHeight: 6,
            legendLabelMargin: 14,
            offset: 0,
            onClickEffect: { type: 'offset', offset: 20 },
            onHoverEffect: null
        },

        series: [],

        attrs: {
            '.background > rect': { opacity: 0 },
            '.background > text': { fill: 'black', text: 'No data available.', ref: '.background > rect', 'ref-x': .5, 'ref-y': .5, 'text-anchor': 'middle', 'y-alignment': 'middle', display: 'none' },
            '.foreground > rect': { fill: 'white', stroke: '#e5e5e5', opacity: 0, 'pointer-events': 'none' },
            '.foreground .caption': { fill: 'black', text: '', ref: '.foreground > rect', 'ref-x': 2, 'ref-y': 6, 'text-anchor': 'start', 'y-alignment': 'middle', 'font-size': 14 },
            '.foreground .subcaption': { fill: 'black', text: '', ref: '.foreground > rect', 'ref-x': 2, 'ref-y': 18, 'text-anchor': 'start', 'y-alignment': 'middle', 'font-size': 10 },
            '.data': { ref: '.background', 'ref-x': .5, 'ref-y': .5 },
            '.slice': { cursor: 'pointer' },
            '.slice > .slice-fill': { stroke: '#ffffff', 'stroke-width': 1, 'fill-opacity': 1 },
            '.slice.hover > .slice-fill': { 'fill-opacity': .8 },
            '.slice > .slice-border': { 'stroke-width': 6, 'stroke-opacity': .4, 'fill-opacity': 1, fill: 'none', display: 'none' },
            '.slice.hover > .slice-border': { display: 'block' },
            '.slice > .slice-inner-label': { 'text-anchor': 'middle', 'font-size': '12', stroke: 'none', 'stroke-width': '0', fill: '#ffffff', dy: '-.5em' },
            '.legend': { ref: '.background', 'ref-dx': 20, 'ref-y': 5 },
            '.legend-serie text': { fill: 'grey', transform: 'translate(2, 0)', 'font-size': 13 },
            '.legend-slice': { cursor: 'pointer' },
            '.legend-slice text': { 'font-weight': 'normal', fill: 'black', 'font-size': 11 },
            '.legend-slice.hover text': { 'font-weight': 'bold' },
            '.legend-slice circle': { r: 5, transform: 'translate(5,5)' }
        }

    }, joint.shapes.basic.Generic.prototype.defaults),

    addSlice: function (slice, serieIndex, opt) {

        opt = opt || {};
        serieIndex = serieIndex || 0;

        var series = this.get('series');

        // If serie is undefinied (first slice added to serie)
        if (_.isUndefined(series[serieIndex])) series[serieIndex] = { data: [] };

        // Clone the serie so that the normal Backbone mechanism for `set()` and `prev()` works as expected.
        var serie = _.cloneDeep(series[serieIndex]);
        serie.data.push(slice);

        // Again, slice the array so that we don't alter the `series` array currently set.
        series = series.slice();
        series[serieIndex] = serie;

        // If it's a new serie (first slice added)
        opt = serie.data.length > 1 ? _.extend(opt, { changedSerieIndex: serieIndex }) : opt;

        // Set in opt the serieIndex that change for update only serieIndex on view (could it be better?)
        this.set('series', series, opt);
    },

    editSlice: function (slice, sliceIndex, serieIndex, opt) {

        opt = opt || {};
        serieIndex = serieIndex || 0;

        var series = this.get('series');

        if (_.isUndefined(series[serieIndex]) || _.isUndefined(series[serieIndex].data[sliceIndex])) {
            throw new Error('Slice ' + sliceIndex + ' on serie ' + serieIndex + ' was not found.');
        }

        // Clone the serie so that the normal Backbone mechanism for `set()` and `prev()` works as expected.
        var serie = _.cloneDeep(series[serieIndex]);
        serie.data[sliceIndex] = _.extend(serie.data[sliceIndex], slice);

        // Again, slice the array so that we don't alter the `series` array currently set.
        series = series.slice();
        series[serieIndex] = serie;

        this.set('series', series, _.extend(opt, { changedSerieIndex: serieIndex }));
    }
});

joint.shapes.chart.PieView = joint.dia.ElementView.extend({

    events: {
        'mouseover .slice': 'onMouseOverSlice',
        'mouseout .slice': 'onMouseOverSlice',
        'mousemove .slice': 'onMouseMoveSlice',
        'mouseover .legend-slice': 'onEventLegendItem',
        'mouseout .legend-slice': 'onEventLegendItem'
    },

    initialize: function () {

        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        // Little optimization that update only the serie changed
        this.listenTo(this.model, 'change:series change:serieDefaults change:sliceDefaults change:pieHole',
            function (model, attr, opt) {
                this.update(null, null, opt.changedSerieIndex);
            });

        this.on('cell:pointerclick', this.onClickSlice, this);
        this.on('cell:pointerclick', this.onEventLegendItem, this);
    },

    renderMarkup: function () {

        joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments);

        // Cache important elements for faster access.
        this.elBackgroundRect = this.$('.background rect')[0];
        this.elBackgroundText = this.$('.background text')[0];

        this.elForegroundRect = this.$('.foreground rect')[0];

        this.elLegendItems = this.$('.legend-items')[0];

        this.elPie = this.$('.data')[0];

        // An SVG element for repeatable elements. This will be used as an original for future clones.
        this.elSlice = V(this.model.sliceMarkup);
        this.elSliceFill = V(this.model.sliceFillMarkup);
        this.elSliceBorder = V(this.model.sliceBorderMarkup);
        this.elSliceInnerLabel = V(this.model.sliceInnerLabelMarkup);

        this.elLegendSerie = V(this.model.legendSerieMarkup);
        this.elLegendSlice = V(this.model.legendSliceMarkup);
    },

    update: function (cell, renderingOnlyAttrs, serieIndex) {

        var series = this.calculateSeries(serieIndex);

        if (serieIndex in series) {
            // Remove only the serieIndex for which is request update
            $(this.elPie).find('.serie-' + serieIndex).remove();
        } else {
            // Remove all the previously rendered series.
            $(this.elPie).empty();
        }

        var size = this.model.get('size');
        V(this.elBackgroundRect).attr(size);
        V(this.elForegroundRect).attr(size);

        if (!series.length) {
            // No data available.
            // Show the "No data available" label that is hidden by default.
            $(this.elBackgroundText).show();
        } else {
            $(this.elBackgroundText).hide();
        }

        _.each(series, function (serie, index) {
            // Use serieIndex for update only the requested serie
            if (!_.isUndefined(serieIndex) && serieIndex !== index) return;

            _.each(serie.data, function (slice) {
                this.updateSlice(slice);
            }, this);
        }, this);

        this.updateLegend();

        // Apply attrs.
        joint.dia.ElementView.prototype.update.apply(this, arguments);
    },

    calculateSeries: function (serieIndex) {

        var series = _.cloneDeep(this.model.get('series'));

        var serieDefaults = this.model.get('serieDefaults');
        var sliceDefaults = this.model.get('sliceDefaults');

        // Pie outer radius less margin
        var size = this.model.get('size');
        var radius = (_.min([size.width, size.height]) / 2);

        var pieHole = this.model.get('pieHole');
        pieHole = pieHole > 1 ? pieHole : radius * pieHole;

        var outerRadius = radius;
        var radiusStep = (radius - pieHole) / series.length;

        this._series = _.map(series, function (serie, index) {

            // Use serieIndex for update only the selected serie
            if (!_.isUndefined(serieIndex) && serieIndex !== index) return serie;

            serie = _.defaults(serie, serieDefaults);

            var startAngle = serie.startAngle;

            // Calculate percentage of each slice
            var total = _.reduce(serie.data, function (sum, slice) {
                return sum + slice.value;
            }, 0);
            var circleDividedByTotal = serie.degree / total || 0;
            var percentageDividedByTotal = 100 / total;

            serie.data = _.map(serie.data, function (slice, sliceIndex) {

                // Init default params for all slice (less some attributes valid only for outer slice)
                slice = _.defaults(slice, _.omit(sliceDefaults, 'offset', 'onClickEffect', 'onHoverEffect'));

                slice.outerRadius = outerRadius;
                slice.innerRadius = outerRadius - radiusStep;

                // For outer slice
                if (!index) {
                    // Init default params for outer slice
                    slice = _.defaults(slice, _.pick(sliceDefaults, 'offset', 'onClickEffect', 'onHoverEffect'));

                    slice.outer = true;
                    slice.offset = slice.offset > 1 ? slice.offset : slice.offset * slice.outerRadius;
                    slice.onClickEffect.offset = slice.onClickEffect.offset > 1 ? slice.onClickEffect.offset : slice.onClickEffect.offset * slice.outerRadius;
                }

                slice.serieIndex = index;
                slice.sliceIndex = sliceIndex;
                slice.innerLabelMargin = (slice.innerLabelMargin < -1 || slice.innerLabelMargin > 1) ? slice.innerLabelMargin : slice.innerLabelMargin * slice.outerRadius;
                slice.percentage = slice.value * percentageDividedByTotal;

                var angle = slice.value * circleDividedByTotal;

                slice.degree = {
                    angle: angle,
                    start: startAngle,
                    end: angle + startAngle
                };

                slice.rad = {
                    angle: g.toRad(slice.degree.angle, true),
                    start: g.toRad(slice.degree.start, true),
                    end: g.toRad(slice.degree.end, true)
                };

                slice.middleangle = (slice.rad.start + slice.rad.end) / 2;

                startAngle = slice.degree.end;

                return slice;
            });

            outerRadius -= radiusStep;

            return serie;
        });

        return this._series;
    },

    updateLegend: function () {

        var series = this._series;

        this.elLegendItems.textContent = '';

        var xPadding = 0;
        var fontSizeLegendSerieText = parseInt(this.model.attr('.legend-serie text/font-size'), 10);
        var fontSizeLegendSliceText = parseInt(this.model.attr('.legend-slice text/font-size'), 10);

        _.each(series, function (serie, serieIndex) {

            if (!serie.showLegend) return;

            // Append Serie label
            if (serie.label) {
                var elLegendSerie = this.elLegendSerie.clone();

                if (serie.name) elLegendSerie.addClass(serie.name);
                elLegendSerie.attr({ 'data-serie': serieIndex });

                elLegendSerie.findOne('text').text(serie.label);
                elLegendSerie.translate(0, xPadding);

                V(this.elLegendItems).append(elLegendSerie);

                // 1.5 is the proportional space between the legend items (one and half height of item)
                xPadding += (fontSizeLegendSerieText + serie.labelLineHeight);
            }

            // Append Slices
            _.each(serie.data, function (slice, sliceIndex) {

                var elLegendSlice = this.elLegendSlice.clone();

                var slicefillColor = this.getSliceFillColor(sliceIndex, serieIndex);

                if (slice.name) elLegendSlice.addClass(slice.name);
                elLegendSlice.attr({ 'data-serie': serieIndex, 'data-slice': sliceIndex });

                elLegendSlice.findOne('circle').attr({ fill: slicefillColor });
                elLegendSlice.findOne('text').text(joint.util.format.string(slice.legendLabel, slice));
                elLegendSlice.findOne('text').translate(slice.legendLabelMargin);
                elLegendSlice.translate(0, xPadding);

                // 1.5 is the proportional space between the legend items (one and half height of item)
                xPadding += (fontSizeLegendSliceText + slice.legendLabelLineHeight);

                V(this.elLegendItems).append(elLegendSlice);

                // is a gradient
                if (_.isObject(slicefillColor)) {

                    this.applyGradient('#' + elLegendSlice.findOne('circle').attr('id'), 'fill', slicefillColor);
                }


            }, this);
        }, this);
    },

    updateSlice: function (slice) {

        var elSlice = this.elSlice.clone();

        // Append slice (at start for use .bbox() later)
        V(this.elPie).append(elSlice);

        // RENDER SLICE
        var elSliceFill = this.elSliceFill.clone();

        var slicefillColor = this.getSliceFillColor(slice.sliceIndex, slice.serieIndex);

        elSliceFill.attr({
            fill: slicefillColor,
            d: this.drawSlice(slice.innerRadius, slice.outerRadius, slice.rad.start, slice.rad.end)
        });

        elSlice.append(elSliceFill);

        // is a gradient
        if (_.isObject(slicefillColor)) {

            this.applyGradient('#' + elSliceFill.attr('id'), 'fill', slicefillColor);
        }

        // RENDER BORDER
        var elSliceBorder = this.elSliceBorder.clone();

        // ...with polar coordinate
        var borderStrokeWidth = parseInt(this.model.attr('.slice > .slice-border/stroke-width'), 10);
        var startPoint = g.point.fromPolar(slice.outerRadius + borderStrokeWidth / 2, -slice.rad.start, g.point(0, 0));
        var endPoint = g.point.fromPolar(slice.outerRadius + borderStrokeWidth / 2, -slice.rad.end, g.point(0, 0));

        elSliceBorder.attr({
            stroke: slicefillColor,
            d: this.drawArc(startPoint, endPoint, slice.outerRadius + borderStrokeWidth / 2, slice.rad.start, slice.rad.end)
        });

        elSlice.append(elSliceBorder);

        // is a gradient
        if (_.isObject(slicefillColor)) {

            this.applyGradient('#' + elSliceBorder.attr('id'), 'stroke', slicefillColor);
        }

        // RENDER INNER LABEL
        var elSliceInnerLabel = this.elSliceInnerLabel.clone();

        // Apply inner label text through template
        elSliceInnerLabel.text(joint.util.format.string(slice.innerLabel, slice));

        elSlice.append(elSliceInnerLabel);

        // After the append (inserted in DOM) can calculate bbox of element
        var innerLabelBbox = elSliceInnerLabel.bbox();

        // Translate label: the gap from the middle of the text (bbox) and the pie border is constant
        var radiusLabel = (slice.outerRadius - innerLabelBbox.width / 2) - slice.innerLabelMargin;

        elSliceInnerLabel.translate((radiusLabel * Math.cos(-slice.middleangle)),
            (-radiusLabel * Math.sin(-slice.middleangle)));

        // Add element data attributes
        elSlice.attr({
            'data-serie': slice.serieIndex,
            'data-slice': slice.sliceIndex,
            'data-value': slice.value
        });

        // Add class for styling use
        var nameSerie = this._series[slice.serieIndex].name;

        if (nameSerie) elSlice.addClass(nameSerie);
        if (slice.name) elSlice.addClass(slice.name);

        elSlice.addClass('serie-' + slice.serieIndex + ' slice-' + slice.sliceIndex);

        // Is an outer slice
        if (slice.outer) {
            elSlice.addClass('outer');

            // Apply init offset for explode some slices
            if (slice.offset) {
                elSlice.addClass('clicked');

                this.effectOnSlice(elSlice, slice, { type: 'offset', offset: slice.offset })
            }
        }

        return elSlice;
    },

    getSliceFillColor: function (sliceIndex, serieIndex) {

        serieIndex = serieIndex || 0;

        var attrs = this.model.get('attrs');

        // Find if there is customized fill color for selected slice in attrs
        var sliceFillAttr = _.find(attrs, function (attr, selector) {
            return selector.indexOf('.serie-' + serieIndex + '.slice-' + sliceIndex + ' > .slice-fill') > -1;
        });

        return sliceFillAttr ? sliceFillAttr.fill : this._series[serieIndex].data[sliceIndex].fill;
    },

    onMouseMoveSlice: function (event) {

        var elSlice = V(event.currentTarget);

        var serieIndex = elSlice.attr('data-serie');
        var sliceIndex = elSlice.attr('data-slice');

        var slice = this._series[serieIndex].data[sliceIndex];

        this.trigger(event.type, slice, event);
    },

    mouseOverSlice: function (sliceIndex, serieIndex) {

        serieIndex = serieIndex || 0;

        var elSlice = V(this.$('.slice[data-serie="' + serieIndex + '"][data-slice="' + sliceIndex + '"]')[0]);

        var slice = this._series[serieIndex].data[sliceIndex];

        elSlice.toggleClass('hover');

        // Do effect if it is an outer slice and requested
        if (slice.outer && !_.isEmpty(slice.onHoverEffect)) {
            this.effectOnSlice(elSlice, slice, slice.onHoverEffect, elSlice.hasClass('hover') ? false : true);
        }

        // Add class 'hover' also to legend
        var elLegendSlice = V(this.$('.legend-slice[data-serie="' + serieIndex + '"][data-slice="' + sliceIndex + '"]')[0]);
        if (elLegendSlice) elLegendSlice.toggleClass('hover');

        // Apply only attr style with selector '.slice' or '.legend-slice'
        var attrsForSliceAndLegend = _.filter(_.keys(this.model.get('attrs')), function (selector) {
            return (selector.indexOf('.slice') > -1 || selector.indexOf('.legend-slice') > -1);
        });

        joint.dia.ElementView.prototype.update.call(this, this.model, _.pick(this.model.get('attrs'), attrsForSliceAndLegend));
    },

    onMouseOverSlice: function (event) {

        var elSlice = V(event.currentTarget);

        var serieIndex = elSlice.attr('data-serie');
        var sliceIndex = elSlice.attr('data-slice');

        this.mouseOverSlice(sliceIndex, serieIndex);

        var slice = this._series[serieIndex].data[sliceIndex];

        this.trigger(event.type, slice, event);
    },

    clickSlice: function (sliceIndex, serieIndex) {

        serieIndex = serieIndex || 0;

        var elSlice = V(this.$('.slice[data-serie="' + serieIndex + '"][data-slice="' + sliceIndex + '"]')[0]);

        var slice = this._series[serieIndex].data[sliceIndex];

        if (!slice.outer) return;

        if (!elSlice.hasClass('clicked')) {
            elSlice.addClass('clicked');

            // Update the model series => resize and clone preserve offset
            this.model.get('series')[serieIndex].data[sliceIndex].offset = slice.onClickEffect.offset;

            this.effectOnSlice(elSlice, slice, slice.onClickEffect);
        } else {
            elSlice.removeClass('clicked');

            // Update the model series => resize and clone preserve offset
            this.model.get('series')[serieIndex].data[sliceIndex].offset = 0;

            this.effectOnSlice(elSlice, slice, slice.onClickEffect, true);
        }
    },

    onClickSlice: function (event) {

        // Only for outer (external slice)
        var elSlice = V($(event.target).closest('.slice.outer')[0]);

        if (elSlice) {

            var serieIndex = elSlice.attr('data-serie');
            var sliceIndex = elSlice.attr('data-slice');

            this.clickSlice(sliceIndex, serieIndex);

            var slice = this._series[serieIndex].data[sliceIndex];

            this.trigger(event.type, slice, event);
        }
    },

    onEventLegendItem: function (event) {

        var elLegendItem = V($(event.target).closest('.legend-slice')[0]);

        if (elLegendItem) {

            var serieIndex = elLegendItem.attr('data-serie');
            var sliceIndex = elLegendItem.attr('data-slice');

            switch (event.type) {
                case 'click':
                    this.clickSlice(sliceIndex, serieIndex);
                    break;
                case 'mouseover':
                case 'mouseout':
                    this.mouseOverSlice(sliceIndex, serieIndex);
                    break;
            }
        }
    },

    effectOnSlice: function (elSlice, slice, effect, remove) {

        remove = remove || false;

        switch (effect.type) {
            case 'enlarge':
                if (!remove) elSlice.scale(effect.scale || 1.05);
                else elSlice.scale(1);
                break;
            case 'offset':
                if (!remove) elSlice.translate(effect.offset * Math.cos(-slice.middleangle), -effect.offset * Math.sin(-slice.middleangle));
                else elSlice.translate(0, 0, { absolute: true });
                break;
        }
    },

    svgArcMax: 2 * Math.PI - 1e-6,
    drawArc: function (startPoint, endPoint, radius, startAngle, endAngle) {
        var largeArcFlag = 0;
        var sweepFlag = 1;

        var angle = endAngle - startAngle;

        if (angle > Math.PI) {

            largeArcFlag = 1;

            if (angle >= this.svgArcMax) {
                largeArcFlag = 0;
                sweepFlag = 0;
            }
        }

        return "M" + startPoint.x + "," + startPoint.y + " A" + radius + ","
            + radius + " 0 " + largeArcFlag + "," + sweepFlag
            + " " + endPoint.x + "," + endPoint.y;
    },

    // Inspired by d3.js https://github.com/mbostock/d3/blob/master/src/svg/arc.js
    drawSlice: function (innerRadius, outerRadius, startAngle, endAngle) {

        var r0 = innerRadius;
        var r1 = outerRadius;
        var a0 = startAngle;
        var a1 = endAngle;
        var da = (a1 < a0 && (da = a0, a0 = a1, a1 = da), a1 - a0);
        var df = da < Math.PI ? "0" : "1";
        var c0 = Math.cos(a0);
        var s0 = Math.sin(a0);
        var c1 = Math.cos(a1);
        var s1 = Math.sin(a1);

        return da >= this.svgArcMax
            ? (r0
            ? "M0," + r1
            + "A" + r1 + "," + r1 + " 0 1,1 0," + (-r1)
            + "A" + r1 + "," + r1 + " 0 1,1 0," + r1
            + "M0," + r0
            + "A" + r0 + "," + r0 + " 0 1,0 0," + (-r0)
            + "A" + r0 + "," + r0 + " 0 1,0 0," + r0
            + "Z"
            : "M0," + r1
            + "A" + r1 + "," + r1 + " 0 1,1 0," + (-r1)
            + "A" + r1 + "," + r1 + " 0 1,1 0," + r1
            + "Z")
            : (r0
            ? "M" + r1 * c0 + "," + r1 * s0
            + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1
            + "L" + r0 * c1 + "," + r0 * s1
            + "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0
            + "Z"
            : "M" + r1 * c0 + "," + r1 * s0
            + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1
            + "L0,0"
            + "Z");
    }
});

// Knob chart. 
// -----------

// Supports the following properties:
// `min` and `max` for defining the domain of the `value`.
// `value` is the final value of the knob.
// `fill` for the fill color of the knob.
// Moreover, all of these properties can be arrays in which case the knob
// displayes more values stacked one on another.
joint.shapes.chart.Knob = joint.shapes.chart.Pie.extend({

    defaults: joint.util.deepSupplement({
	type: 'chart.Knob',
	sliceDefaults: {
	    legendLabel: '{value:.0f}',
	    outer: { offsetOnClick: 0 }
	},
	pieHole: .7,
	value: 0,
	attrs: {
            '.legend': { 'ref-x': .5, 'ref-y': .5, 'x-alignment': -.9, 'y-alignment': -.4 },
	    '.legend-slice text': { 'font-size': 30 },
	    '.legend-slice circle': { display: 'none' },
	    '.slice-inner-label': { display: 'none' },
	    '.slice-fill': { stroke: 'none' }
	}
    }, joint.shapes.chart.Pie.prototype.defaults),

    initialize: function() {

	this.set('series', this.getKnobSeries(), { silent: true });
	joint.shapes.chart.Pie.prototype.initialize.apply(this, arguments);
	this.on('change:value change:min change:max change:fill', this.updateKnob, this);
    },

    getKnobSeries: function() {

	// Create one serie with one slice holding the knob value and color.
	var values = _.isArray(this.get('value')) ? this.get('value') : [this.get('value')];
	var fills = _.isArray(this.get('fill')) ? this.get('fill') : [this.get('fill')];
	var mins = _.isArray(this.get('min')) ? this.get('min') : [this.get('min')];
	var maxs = _.isArray(this.get('max')) ? this.get('max') : [this.get('max')];
	var series = _.map(values, function(value, i) {

	    var min = _.isUndefined(mins[i]) ? mins[0] : mins[i];
	    var max = _.isUndefined(maxs[i]) ? maxs[0] : maxs[i];
	    var fill = _.isUndefined(fills[i]) ? fills[0] : fills[i];
	    return { 
		degree: g.scale.linear([min, max], [0, 360], value),
		data: [ { value: value, fill: fill } ],
		showLegend: i > 0 ? false : true // Show legend only for the first serie.
	    };
	});

	return series;
    },

    updateKnob: function() {

	this.set('series', this.getKnobSeries());
    }
});

joint.shapes.chart.KnobView = joint.shapes.chart.PieView;


// Matrix diagram.
joint.shapes.chart.Matrix = joint.shapes.basic.Generic.extend({

    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<g class="background"><rect/></g>',
        '<g class="cells"/>',
        '<g class="foreground"/>',
        '</g>',
        '<g class="labels">',
        '<g class="rows"/>',
        '<g class="columns"/>',
        '</g>',
        '</g>'
    ].join(''),

    cellMarkup: '<rect class="cell"/>',
    labelMarkup: '<text class="label"/>',
    gridLineMarkup: '<path class="grid-line"/>',
    
    defaults: joint.util.deepSupplement({
    
        type: 'chart.Matrix',

        attrs: {
            '.background rect': { fill: '#eeeeee' },
            '.grid-line': { stroke: 'white', 'stroke-width': 2 },
            '.label': { fill: 'black', 'alignment-baseline': 'middle' },
            '.labels .rows .label': { 'text-anchor': 'end' },
            '.labels .columns .label': { 'text-anchor': 'start' }
        }

    }, joint.shapes.basic.Generic.prototype.defaults)
});

joint.shapes.chart.MatrixView = joint.dia.ElementView.extend({

    initialize: function() {
        
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change:size', _.bind(function() { this.renderLabels(); this.update(); }, this));
        this.listenTo(this.model, 'change:cells', _.bind(function() { this.renderMarkup(); this.update() }, this));
    },

    renderMarkup: function() {

        joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments);

        this.elCells = this.$('.cells')[0];
        this.elRowLabels = this.$('.labels .rows')[0];
        this.elColumnLabels = this.$('.labels .columns')[0];
        this.elForeground = this.$('.foreground')[0];

        this.elCell = V(this.model.cellMarkup);
        this.elGridLine = V(this.model.gridLineMarkup);

        var cells = this.model.get('cells') || [];
        var size = this.model.get('size');

        this.elBackgroundRect = this.$('.background rect')[0];
        V(this.elBackgroundRect).attr(size);

        var cellHeight = size.height / cells.length;
        var cellWidth = size.width / cells.length;
        var elCellsFragment = document.createDocumentFragment();
        this.elCells.textContent = '';

        this.elForeground.textContent = '';
        var elGridLinesFragment = document.createDocumentFragment();

        // Cells.
        // ------

        for (var i = 0; i < cells.length; i++) {

            var elGridLine = this.elGridLine.clone();
            elGridLine.addClass('horizontal');
            elGridLine.attr('d', 'M 0 ' + (i * cellHeight) + ' ' + size.width + ' ' + (i * cellHeight));
            elGridLinesFragment.appendChild(elGridLine.node);

            var row = cells[i];
            for (var j = 0; j < row.length; j++) {

                if (i === 0) {

                    var elGridLine = this.elGridLine.clone();
                    elGridLine.addClass('vertical');
                    elGridLine.attr('d', 'M ' + (j * cellWidth) + ' 0 ' + (j * cellWidth) + ' ' + size.height);
                    elGridLinesFragment.appendChild(elGridLine.node);
                }

                var cell = row[j];
                
                if (cell) {
                    var elCell = this.elCell.clone();
                    elCell.attr(_.extend({
                        x: j * cellWidth,
                        y: i * cellHeight,
                        width: cellWidth,
                        height: cellHeight
                    }, cell));

                    elCellsFragment.appendChild(elCell.node);
                }
            }
        }

        this.elForeground.appendChild(elGridLinesFragment);
        this.elCells.appendChild(elCellsFragment);

        this.renderLabels();
    },

    renderLabels: function() {

        // Labels are outside the scalables groups. Therefore, 
        // we must make sure their position stays correct after resize.

        this.elLabel = V(this.model.labelMarkup);

        var cells = this.model.get('cells') || [];
        var labels = this.model.get('labels') || {};
        var rowLabels = labels.rows || [];
        var columnLabels = labels.columns || [];
        var size = this.model.get('size');

        var cellHeight = size.height / cells.length;
        var cellWidth = size.width / cells.length;

        this.elRowLabels.textContent = '';
        this.elColumnLabels.textContent = '';

        var elRowLabelsFragment = document.createDocumentFragment();
        for (var i = 0; i < rowLabels.length; i++) {

            var label = labels.rows[i];
            var elLabel = this.elLabel.clone();
            elLabel.text(label.text);
            elLabel.attr(_.extend({ 
                x: -(labels.padding || 5), 
                y: i * cellHeight + cellHeight/2,
                'text-anchor': 'end',
                'alignment-baseline': 'middle',
                'font-size': cellHeight,
                'data-row': i
            }, _.omit(label, 'text')));
            elRowLabelsFragment.appendChild(elLabel.node);
        }
        this.elRowLabels.appendChild(elRowLabelsFragment);

        var elColumnLabelsFragment = document.createDocumentFragment();
        for (var j = 0; j < columnLabels.length; j++) {

            var label = labels.columns[j];
            var elLabel = this.elLabel.clone();
            elLabel.text(label.text);
            var x = j * cellWidth + cellWidth/2;
            var y = -(labels.padding || 5);
            elLabel.attr(_.extend({
                x: x,
                y: y,
                'text-anchor': 'start',
                'alignment-baseline': 'middle',
                'font-size': cellWidth,
                'data-column': j
            }, _.omit(label, 'text')));
            elLabel.rotate(-90, x, y);
            elColumnLabelsFragment.appendChild(elLabel.node);
        }
        this.elColumnLabels.appendChild(elColumnLabelsFragment);
    }
});

if (typeof exports === 'object') {

    module.exports = joint.shapes.chart;
}
