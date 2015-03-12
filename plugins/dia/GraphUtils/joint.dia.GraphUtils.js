// Various utility functions for graph construction.
// =================================================

// This plugin extends the `joint.dia.Graph` object with additional methods.


// Construct a tree from JSON structure of the form:
// `{ name: 'my label', children: [ { name: 'my label 2', children: [...] }, ...] }`
// `parent` is the tree object, i.e. the top level node.
// `opt.children` is the property specifying the children array. `'children'` is the default.
// If `opt.children` is a function, it will called with the current node as an argument and should return an array of its child nodes.
// `opt.makeElement` is a function that is passed the current tree node and returns a JointJS element for it.
// `opt.makeLink` is a function that is passed a parent and child nodes and returns a JointJS link for the edge.
joint.dia.Graph.prototype.constructTree = function(parent, opt, parentElement, collector) {

    collector = collector || [];

    var children = _.isFunction(opt.children) ? opt.children(parent) : parent[opt.children || 'children'];

    if (!parentElement) {

	parentElement = opt.makeElement(parent)
	collector.push(parentElement);
    }

    _.each(children, function(child) {

	var childElement = opt.makeElement(child);
	var link = opt.makeLink(parentElement, childElement);
	collector.push(childElement, link);

	this.constructTree(child, opt, childElement, collector);

    }, this);

    return collector;
};

// Returns an array of IDs of nodes on the shortest path between `source` and `target`.
// `source` and `target` can either be elements or IDs of elemements.
// `opt.weight` is an optional function returning a distance between two nodes.
// If `opt.directed` is `true`, the algorithm will take link direction into account.
joint.dia.Graph.prototype.shortestPath = function(source, target, opt) {

    opt = opt || {};

    var adjacencyList = {};
    _.each(this.getLinks(), function(link) {

        var sourceId = link.get('source').id;
        var targetId = link.get('target').id;
        if (!adjacencyList[sourceId]) {
            adjacencyList[sourceId] = [];
        }
        if (!adjacencyList[targetId]) {
            adjacencyList[targetId] = [];
        }
        
        adjacencyList[sourceId].push(targetId);
        if (!opt.directed) {
            adjacencyList[targetId].push(sourceId);
        }
    });

    var previous = joint.alg.Dijkstra(adjacencyList, source.id || source, opt.weight);

    var path = [];
    var u = target.id || target;
    if (previous[u]) path.push(u);
    while (u = previous[u]) {
        path.unshift(u);
    }
    return path;
};
