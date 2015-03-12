var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 10000, height: 800, gridSize: 1, model: graph });

// This is our tree in JSON.

var tree = {
    name: 'root',
    children: [
	{ name: '1', 
	  children: [{ name: '1-1' }, { name: '1-2' }] },
	{ name: '2', 
	  children: [{ name: '2-1' }, { name: '2-2' }] },
	{ name: '3', 
	  children: [
	      { 
		  name: '3-1', 
		  children: [ { name: '3-1-1', children: [{ name: '3-1-1-1' }, { name: '3-1-1-2' }] } ] 
	      },
	      { name: '3-2' }
	  ] 
	}    
    ]
};

// Construct the JointJS elements and links out of the tree.

var cells = graph.constructTree(tree, {
    makeElement: function(node) {
	return new joint.shapes.basic.Rect({
	    size: { width: 80, height: 30 },
	    attrs: { 
		text: { text: node.name, fill: 'white', 'font-size': 11, style: { 'text-shadow': '1px 1px 0px gray' } },
		rect: { fill: node.children ? '#77c63d' : '#ff5246', rx: 5, ry: 5, stroke: 'none' }
	    }
	});
    },
    makeLink: function(parentElement, childElement) {
	return new joint.dia.Link({
	    source: { id: parentElement.id },
	    target: { id: childElement.id },
	    attrs: { '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' } }
	});
    }
});
graph.resetCells(cells);

// Layout the tree.

var inputGraph = joint.layout.DirectedGraph._prepareData(graph);
var runner = dagre.layout();

runner.rankDir('LR');
var layoutGraph = runner.run(inputGraph);
layoutGraph.eachNode(function(u, value) {
    if (!value.dummy) {
	graph.getCell(u).transition('position/x', value.x - value.width/2);
	graph.getCell(u).transition('position/y', value.y - value.height/2);
    }
});
