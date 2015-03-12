function makeLink(parentElementLabel, childElementLabel) {

    return new joint.dia.Link({
        source: { id: parentElementLabel },
        target: { id: childElementLabel },
        attrs: { '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' } }
    });
}

function makeElement(label) {

    var maxLineLength = _.max(label.split('\n'), function(l) { return l.length; }).length;

    // Compute width/height of the rectangle based on the number 
    // of lines in the label and the letter size. 0.6 * letterSize is
    // an approximation of the monospace font letter width.
    var rankDir = 'R';
    var width = 20;
    var height = 20;
    var r = 5;
    
    if (label.indexOf('x') > -1) { width = 40; height = 40; }
    if (label.indexOf('y') > -1) { rankDir = 'L'; }
    if (label.indexOf('z') > -1) { rankDir = 'C'; r = '50%'; }

    return new joint.shapes.basic.Rect({
        id: label,
        size: { width: width, height: height },
        attrs: {
            text: { text: label, 'font-size': 10, 'font-family': 'monospace' },
            rect: {
                width: width, height: height,
                rx: r, ry: r,
                stroke: '#555'
            }
        },
        rankDir: rankDir
    });
}

function buildGraphFromAdjacencyList(adjacencyList) {

    var elements = [];
    var links = [];
    
    _.each(adjacencyList, function(edges, parentElementLabel) {
        elements.push(makeElement(parentElementLabel));

        _.each(edges, function(childElementLabel) {
            links.push(makeLink(parentElementLabel, childElementLabel));
        });
    });

    // Links must be added after all the elements. This is because when the links
    // are added to the graph, link source/target
    // elements must be in the graph already.
    return elements.concat(links);
}

var list = {
    'az': ['b', 'cy'],
    'b': ['fxf'],
    'cy': ['ey', 'dxdy'],
    'dxdy': ['iy'],
    'ey': ['hy'],
    'fxf': ['g'],
    'g': [],
    'hy': [],
    'iy': []
};

var cells = buildGraphFromAdjacencyList(list);

// Create paper and populate the graph.
// ------------------------------------

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 2000,
    height: 4000,
    gridSize: 1,
    model: graph,
    async: true
});

graph.resetCells(cells);

var graphLayout = new joint.layout.TreeLayout({
    graph: graph,
    verticalGap: 20,
    horizontalGap: 40
});

var treeLayoutView = new joint.ui.TreeLayoutView({
    paper: paper,
    model: graphLayout,
    xCoordinateOffset: 20
});

var root = cells[0].position(400, 200);

graphLayout.layout();

