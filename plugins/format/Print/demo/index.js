var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 500,
    height: 300,
    gridSize: 1,
    perpendicularLinks: true,
    model: graph
});

$('#print-btn').click(_.bind(function() { paper.print(); }, paper));

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
