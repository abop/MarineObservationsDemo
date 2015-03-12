joint.format.gexf = {};

joint.format.gexf.toCellsArray = function(xmlString, makeElement, makeLink) {

    // Parse the `xmlString` into a DOM tree.
    var parser = new DOMParser();
    var dom = parser.parseFromString(xmlString, 'text/xml');
    if (dom.documentElement.nodeName == "parsererror") {
        throw new Error('Error while parsing GEXF file.');
    }

    // Get all nodes and edges.
    var nodes = dom.documentElement.querySelectorAll('node');
    var edges = dom.documentElement.querySelectorAll('edge');

    // Return value.
    var cells = [];

    _.each(nodes, function(node) {

        var size = parseFloat(node.querySelector('size').getAttribute('value'));
        
        var element = makeElement({
            id: node.getAttribute('id'),
            width: size,
            height: size,
            label: node.getAttribute('label')
        });
        
        cells.push(element);
    });

    _.each(edges, function(edge) {

        var link = makeLink({ source: edge.getAttribute('source'), target: edge.getAttribute('target') });
        cells.unshift(link);
    });

    return cells;
};
