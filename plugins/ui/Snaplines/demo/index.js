var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 500,
    height: 300,
    gridSize: 1,
    model: graph
});

var snaplines = new joint.ui.Snaplines({ paper: paper });

var r1 = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 120, height: 80 },
    attrs: { text: { text: 'Rect' }}
});

var r2 = new joint.shapes.basic.Rect({
    position: { x: 350, y: 200 },
    size: { width: 100, height: 100 },
    attrs: { text: { text: 'Rect' }}
});

var c = new joint.shapes.basic.Circle({
    position: { x: 250, y: 150 },
    size: { width: 50, height: 50 },
    attrs: { text: { text: 'Circle' }}
});

graph.addCells([r1, r2, c]);

$('#switcher').change(function() {
    if (this.checked) { snaplines.startListening(); } else { snaplines.stopListening(); }
});