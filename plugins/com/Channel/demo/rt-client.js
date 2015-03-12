var r = new joint.shapes.basic.Rect({ 
    position: { x: 10, y: 10 }, size: { width: 50, height: 30 },
    attrs: { rect: { fill: '#2ECC71' }, text: { text: 'rect', fill: 'black' } }
});
var c = new joint.shapes.basic.Circle({ 
    position: { x: 70, y: 10 }, size: { width: 50, height: 30 },
    attrs: { circle: { fill: '#9B59B6' }, text: { text: 'circle', fill: 'white' } }
});

function renderHalo(cellView, evt) {
    if (cellView.model instanceof joint.dia.Link) return;
    (new joint.ui.Halo({ graph: this.model, paper: this, cellView: cellView })).render();
}

// Create papers, graphs and stencils.
// -----------------------------------

var graph1 = new joint.dia.Graph;
var paper1 = new joint.dia.Paper({ el: $('#paper1'), width: 300, height: 200, gridSize: 1, model: graph1 });
paper1.on('cell:pointerup', renderHalo);

var stencil1 = new joint.ui.Stencil({ graph: graph1, paper: paper1, width: 200, height: 200 });
$('#stencil1').append(stencil1.render().el);
stencil1.load([r.clone(), c.clone()]);

var graph2 = new joint.dia.Graph;
var paper2 = new joint.dia.Paper({ el: $('#paper2'), width: 300, height: 200, gridSize: 1, model: graph2 });
paper2.on('cell:pointerup', renderHalo);

var stencil2 = new joint.ui.Stencil({ graph: graph2, paper: paper2, width: 200, height: 200 });
$('#stencil2').append(stencil2.render().el);
stencil2.load([r.clone(), c.clone()]);

var graph3 = new joint.dia.Graph;
var paper3 = new joint.dia.Paper({ el: $('#paper3'), width: 300, height: 200, gridSize: 1, model: graph3 });
paper3.on('cell:pointerup', renderHalo);

var stencil3 = new joint.ui.Stencil({ graph: graph3, paper: paper3, width: 200, height: 200 });
$('#stencil3').append(stencil3.render().el);
stencil3.load([r.clone(), c.clone()]);

var graph4 = new joint.dia.Graph;
var paper4 = new joint.dia.Paper({ el: $('#paper4'), width: 300, height: 200, gridSize: 1, model: graph4 });
paper4.on('cell:pointerup', renderHalo);

var stencil4 = new joint.ui.Stencil({ graph: graph4, paper: paper4, width: 200, height: 200 });
$('#stencil4').append(stencil4.render().el);
stencil4.load([r.clone(), c.clone()]);

// Create channels.
// ----------------

var channelHubUrl = 'ws://localhost:4141';

var channel1 = new joint.com.Channel({ graph: graph1, url: channelHubUrl, query: { room: 'A' } });
var channel2 = new joint.com.Channel({ graph: graph2, url: channelHubUrl, query: { room: 'A' } });
var channel3 = new joint.com.Channel({ graph: graph3, url: channelHubUrl, query: { room: 'B' } });
var channel4 = new joint.com.Channel({ graph: graph4, url: channelHubUrl, query: { room: 'B' } });

