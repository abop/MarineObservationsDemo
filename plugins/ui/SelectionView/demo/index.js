var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 500,
    height: 300,
    gridSize: 20,
    model: graph
});

var selection = new Backbone.Collection;

var selectionView = new joint.ui.SelectionView({
    paper: paper,
    graph: graph,
    model: selection
});


// Initiate selecting when the user grabs the blank area of the paper.
paper.on('blank:pointerdown', selectionView.startSelecting);

paper.on('cell:pointerup', function(cellView, evt) {
    // Select an element if CTRL/Meta key is pressed while the element is clicked.    
    if ((evt.ctrlKey || evt.metaKey) && !(cellView.model instanceof joint.dia.Link)) {
        selection.add(cellView.model);
        selectionView.createSelectionBox(cellView);
    }
});

selectionView.on('selection-box:pointerdown', function(evt) {
    // Unselect an element if the CTRL/Meta key is pressed while a selected element is clicked.    
    if (evt.ctrlKey || evt.metaKey) {
        var cell = selection.get($(evt.target).data('model'));
        selection.reset(selection.without(cell));
        selectionView.destroySelectionBox(paper.findViewByModel(cell));
    }
});

var $btnRotate = $('<div/>', { 'class': 'btn-selection-rotate' });

// Show selected element types in the UI to showcase an easy access to the selected elements.
selection.on('reset add', function() {

    $('#selection').text(selection.pluck('type'));
});

// Add some elements to the graph.
var r = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 120, height: 80 },
    attrs: { text: { text: 'Rect' } }
});
graph.addCell(r);


var c = new joint.shapes.basic.Circle({
    position: { x: 250, y: 80 },
    attrs: { text: { text: 'Circle' } }
});
graph.addCell(c);


selectionView.addHandle({ name: 'myaction', position: 's', icon: 'myaction.png' });

selectionView.on('action:myaction:pointerdown', function(evt) {
    evt.stopPropagation();
    alert('custom action: ' + selection.length + ' elements of types: ' + JSON.stringify(selection.pluck('type')) + '\nMoving handle to the north.');

    selectionView.changeHandle('myaction', { position: 'n' });
});
