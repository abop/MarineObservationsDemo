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
    var letterSize = 8;
    var width = 2 * (letterSize * (0.6 * maxLineLength + 1));
    var height = 2 * ((label.split('x').length + 1) * letterSize);

    return new joint.shapes.basic.Rect({
        id: label,
        size: { width: width, height: height },
        attrs: {
            text: { text: label, 'font-size': letterSize, 'font-family': 'monospace' },
            rect: {
                width: width, height: height,
                rx: 5, ry: 5,
                stroke: '#555'
            }
        },
        rankDir: 'R'
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
    model: graph
});

graph.resetCells(cells);

var graphLayout = new joint.layout.TreeLayout({
    graph: graph,
    verticalGap: 20,
    horizontalGap: 40
});

// root position stays the same after the layout
var root = cells[0].position(200, 200);

graphLayout.layout();
