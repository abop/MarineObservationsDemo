// Adjacency list.
var m = {
    a: ['b', 'c'],
    b: ['d', 'e'],
    c: ['f', 'g'],
    f: ['b'],
    e: ['c'],
    h: ['f', 'g'],
    i: ['h', 'a', 'd', 'g'],
    j: ['a']
};

// Presentational attributes.
var attrs = {
    elementDefault: {
        text: { fill: '#222138', style: { 'text-shadow': '1px 1px 1px white', 'text-transform': 'capitalize' } },
        circle: { fill: '#feb663', stroke: 'white' }
    },
    elementSelected: {
        circle: { fill: '#7c68fc' }
    },
    elementHighlighted: {
        circle: { fill: '#31d0c6' }
    },
    linkDefault: {
        '.connection': { stroke: '#6a6c8a', 'stroke-width': 1 }
    },
    linkDefaultDirected: {
        '.marker-target': { d: 'M 6 0 L 0 3 L 6 6 z' }
    },
    linkHighlighted: {
        '.connection': { stroke: '#33334e', 'stroke-width': 3 }
    }
};

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 800, height: 400, gridSize: 1, model: graph });

// Create a node with `id` at the position `p`.
function n(id, p) {
    var node = (new joint.shapes.basic.Circle({
        id: id,
        position: { x: g.point(p).x, y: g.point(p).y },
        size: { width: 40, height: 40 },
        attrs: attrs.elementDefault
    })).addTo(graph);
    node.attr('text/text', id);
    return node;
}

// Create a link between a source element with id `s` and target element with id `t`.
function l(s, t) {
    (new joint.dia.Link({
        id: [s,t].sort().join(),
        source: { id: s },
        target: { id: t },
        z: -1,
        attrs: attrs.linkDefault
    })).addTo(graph);
}

// Create a random point in the specified area.
function r() {
    return g.point.random(30, 600, 30, 300) + '';
}

// Construct nodes and links based on teh adjancy list.
_.each(m, function(adjs, parent) {
    n(parent, r());
    _.each(adjs, function(adj) {
        // Do not create the node if it's already in the graph.
        if (!graph.getCell(adj)) n(adj, r());
        l(parent, adj);
    });
});

// When a new link is created via UI (in Edit mode), remove the previous link
// and create a new one that has the ID constructed as "nodeA,nodeB". The
// reason we're removing the old link below is that it is not a good idea
// to change ID's of any model in JointJS.
graph.on('change:source change:target', function(link, collection, opt) {

    var sourceId = link.get('source').id;
    var targetId = link.get('target').id;
    if (opt.ui && sourceId && targetId) {

        var newId = [sourceId, targetId].sort().join();
        link.remove();
        l(sourceId, targetId);
    }
});

// Interaction.
// ------------

// Select source.
var selected;
paper.on('cell:pointerdown', function(cellView) {
    if (editMode || cellView.model.isLink()) return;
    if (selected) selected.attr(attrs.elementDefault);
    (selected = cellView.model).attr(attrs.elementSelected);
    hidePath();
});

// Hover an element to select a target.
paper.on('cell:mouseover', function(cellView, evt) {
    if (editMode || cellView.model.isLink() || cellView.model === selected) return;
    if (selected) {
        var path = graph.shortestPath(selected, cellView.model, { directed: directed });
        showPath(path);
        cellView.model.attr(attrs.elementHighlighted);
    }
});

// Deselect target.
paper.on('cell:mouseout', function(cellView, evt) {
    if (editMode || cellView.model.isLink() || cellView.model === selected) return;
    cellView.model.attr(attrs.elementDefault);
    hidePath();
});

// Helpers.

var pathLinks = [];

function hidePath() {
    $('#path').text('');
    _.each(pathLinks, function(link) { 
        link.attr(attrs.linkDefault);
        link.set('labels', []);
    });
}

function showPath(path) {
    
    $('#path').text(path.join(' -> '));
    for (var i = 0; i < path.length; i++) {
        var curr = path[i];
        var next = path[i + 1];
        if (next) {
            var link = graph.getCell([curr, next].sort().join());
            link.label(0, { position: .5, attrs: { 
                text: { text: ' ' + (i + 1) + ' ', 'font-size': 10, fill: 'white' },
                rect: { rx: 8, ry: 8, fill: 'black', stroke: 'black', 'stroke-width': 5 }
            } });
            pathLinks.push(link.attr(attrs.linkHighlighted));
        }
    }
}

// UI.

var directed = false;
$('#opt-directed').on('change', function(evt) {
    directed = $(evt.target).is(':checked');
    _.each(graph.getLinks(), function(link) {
        if (directed) {
            link.attr(attrs.linkDefaultDirected);
        } else {
            link.removeAttr('.marker-target');
        }
    });
});

var editMode;
$('#opt-edit').on('change', function(evt) {
    editMode = $(evt.target).is(':checked');
    _.each(graph.getElements(), function(el) {
        if (editMode) {
            el.attr('circle/magnet', true).attr('text/pointer-events', 'none');
        } else {
            el.removeAttr('circle/magnet').removeAttr('text/pointer-events');
        }
    });
});

paper.on('blank:pointerdblclick', function(evt, x, y) {

    if (editMode) {
        var node = n(_.uniqueId('n'), x + '@' + y);
        node.attr('circle/magnet', true).attr('text/pointer-events', 'none');
    }
});

