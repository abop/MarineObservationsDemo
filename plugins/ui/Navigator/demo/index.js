var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    width: 500,
    height: 300,
    gridSize: 1,
    perpendicularLinks: true,
    model: graph
});

var paperScroller = new joint.ui.PaperScroller({
    paper: paper,
    autoResizePaper: true,
    padding: 50
});
paper.on('blank:pointerdown', paperScroller.startPanning);
paperScroller.$el.css({ width: 500, height: 300 }).appendTo('#paper');
paperScroller.center();

$('#zoom-in').on('click', function() {
    paperScroller.zoom(0.2, { max: 2 });
});
$('#zoom-out').on('click', function() {
    paperScroller.zoom(-0.2, { min: 0.2 });
});

var r = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 120, height: 80 },
    attrs: { text: { text: 'Rect' } }
});
graph.addCell(r);

var c = new joint.shapes.basic.Circle({
    position: { x: 250, y: 50 },
    size: { width: 50, height: 50 },
    attrs: { text: { text: 'Circle' } }
});
graph.addCell(c);

var m = new joint.shapes.devs.Model({
    position: { x: 350, y: 150 },
    size: { width: 70, height: 90 },
    inPorts: ['in1','in2'],
    outPorts: ['out']
});
graph.addCell(m);

// Navigator plugin initalization
var nav = new joint.ui.Navigator({
    paperScroller: paperScroller,
    width: 300,
    height: 200,
    padding: 10,
    zoomOptions: { max: 2, min: 0.2 }
});
nav.$el.appendTo('#navigator');
nav.render();

