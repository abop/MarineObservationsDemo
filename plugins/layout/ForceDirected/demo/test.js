// Paper 1.
// --------

var graph1 = new joint.dia.Graph;
var paper1 = new joint.dia.Paper({

    el: $('#paper1'),
    width: 2000,
    height: 2000,
    gridSize: 1,
    model: graph1,
    elementView: joint.dia.LightElementView,
    linkView: joint.dia.LightLinkView
});
V(paper1.viewport).translate(20, 20);

var cells = [
    { type: 'link', source: { id: 'Dennis' }, target: { id: 'Michael' } },
    { type: 'link', source: { id: 'Michael' }, target: { id: 'Jessica' } },
    { type: 'link', source: { id: 'Jessica' }, target: { id: 'Barbara' } },
    { type: 'link', source: { id: 'Michael' }, target: { id: 'Timothy' } },
    { id: 'Dennis', type: 'basic.Circle', attrs: { text: { text: 'Dennis' } } },
    { id: 'Michael', type: 'basic.Circle', attrs: { text: { text: 'Michael' } } },
    { id: 'Jessica', type: 'basic.Circle', attrs: { text: { text: 'Jessica' } } },
    { id: 'Timothy', type: 'basic.Circle', attrs: { text: { text: 'Timothy' } } },
    { id: 'Barbara', type: 'basic.Circle', attrs: { text: { text: 'Barbara' } } }
];
graph1.fromJSON({ paper: {}, cells: cells });

var graph1Layout = new joint.layout.ForceDirected({
    graph: graph1,
    width: 580, height: 380,
    gravityCenter: { x: 290, y: 190 },
    charge: 180,
    linkDistance: 30
});
graph1Layout.start();


// Paper 2.
// --------

var graph2 = new joint.dia.Graph;
var paper2 = new joint.dia.Paper({

    el: $('#paper2'),
    width: 2000,
    height: 2000,
    gridSize: 1,
    model: graph2,
    elementView: joint.dia.LightElementView,
    linkView: joint.dia.LightLinkView
});
V(paper2.viewport).translate(20, 20);

var cells2 = [
    { type: 'link', source: { id: 'A' }, target: { id: 'B' } },
    { type: 'link', source: { id: 'A' }, target: { id: 'C' } },
    { type: 'link', source: { id: 'A' }, target: { id: 'D' } },
    { type: 'link', source: { id: 'A' }, target: { id: 'E' } },
    { type: 'link', source: { id: 'A' }, target: { id: 'F' } },
    { type: 'link', source: { id: 'A' }, target: { id: 'G' } },
    { type: 'link', source: { id: 'B' }, target: { id: 'H' } },
    { type: 'link', source: { id: 'B' }, target: { id: 'I' } },
    { type: 'link', source: { id: 'B' }, target: { id: 'J' } },
    { id: 'A', type: 'basic.Circle', attrs: { text: { text: 'A' } } },
    { id: 'B', type: 'basic.Circle', attrs: { text: { text: 'B' } } },
    { id: 'C', type: 'basic.Circle', attrs: { text: { text: 'C' } } },
    { id: 'D', type: 'basic.Circle', attrs: { text: { text: 'D' } } },
    { id: 'E', type: 'basic.Circle', attrs: { text: { text: 'E' } } },
    { id: 'F', type: 'basic.Circle', attrs: { text: { text: 'F' } } },
    { id: 'G', type: 'basic.Circle', attrs: { text: { text: 'G' } } },
    { id: 'H', type: 'basic.Circle', attrs: { text: { text: 'H' } } },
    { id: 'I', type: 'basic.Circle', attrs: { text: { text: 'I' } } },
    { id: 'J', type: 'basic.Circle', attrs: { text: { text: 'J' } } }
];

graph2.fromJSON({ paper: {}, cells: cells2 });


var graph2Layout = new joint.layout.ForceDirected({
    graph: graph2,
    width: 580, height: 380,
    gravityCenter: { x: 290, y: 190 },
    charge: 180,
    linkDistance: 30
});
graph2Layout.start();


// Main.
// -----

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function( callback ){
    window.setTimeout(callback, 1000 / 60);
};

function animate() {
    requestAnimationFrame(animate);
    graph1Layout.step();
    graph2Layout.step();
}

$('#animate').on('click', animate);

$('#step').on('click', function() {

    _.each(_.range(100), function() {
        graph1Layout.step();
        graph2Layout.step();
    });
});
