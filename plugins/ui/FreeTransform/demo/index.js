var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 500,
    height: 300,
    gridSize: 10,
    model: graph
});

paper.on('cell:pointerup', function(cellView, evt) {

    if (cellView.model instanceof joint.dia.Link) return;
    
    var freetransform = new joint.ui.FreeTransform({

        graph: graph,
        paper: paper,
        cell: cellView.model
    });

    freetransform.render();
});

var r = new joint.shapes.basic.Rect({
    position: { x: 200, y: 100 },
    size: { width: 50, height: 50 },
    attrs: { text: { text: 'Rect' } }
});
graph.addCell(r);
