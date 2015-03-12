console.oldLog = console.log;
console.log = function() {
    var l = _.reduce(arguments, function(r, a) { return r + ' ' + a; }, '');
    $('#console').append($('<div/>').text(l));
};

function buildGraphFromObject(cells, rootName, graph, obj, parent) {

    if (!parent) {

        parent = makeElement(rootName);
        cells.push(parent);
    }

    _.each(obj, function(value, key) {

        var keyElement = makeElement(key);
        cells.push(keyElement);

        if (parent) {

            var link = makeLink(parent, keyElement);
            cells.push(link);
        }

        if (!_.isFunction(value) && (_.isObject(value) || _.isArray(value))) {

            _.each(value, function(childValue, childKey) {

                var link;

                var childKeyElement = makeElement(childKey);
                cells.push(childKeyElement);

                link = makeLink(keyElement, childKeyElement);
                cells.push(link);

                if (!_.isFunction(childValue) && (_.isObject(childValue) || _.isArray(childValue))) {

                    buildGraphFromObject(cells, rootName, graph, childValue, childKeyElement);

                } else {

                    // Leaf.
                    var grandChildElement = makeElement(childValue);
                    cells.push(grandChildElement);
                    link = makeLink(childKeyElement, grandChildElement);
                    cells.push(link);
                }
            });
            
        } else {

            // Leaf.
            var childKeyElement = makeElement(value);
            cells.push(childKeyElement);

            link = makeLink(keyElement, childKeyElement);
            cells.push(link);
        }
    });
}

function makeLink(el1, el2) {
    return new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id }
    });
}

function makeElement(label) {
    return new joint.shapes.basic.Rect({
        size: { width: 100, height: 20 },
        attrs: {
            text: { text: '' + label }
        }
    });
}

var cells = [];

buildGraphFromObject(cells, 'ROOT', graph, json);

var graphLayout = new joint.layout.TreeLayout({
    graph: (new joint.dia.Graph).resetCells(cells),
    verticalGap: 20,
    horizontalGap: 40
});

var root = cells[0].position(200, 200);
graphLayout.layout(root);


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

var start = new Date().getTime();

paper.on('render:done', function() {
    console.log('render time:', new Date().getTime() - start, 'ms');
    console.log('Cells count:', graph.get('cells').length);

});

