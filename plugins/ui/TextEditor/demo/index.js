var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 1000,
    height: 900,
    gridSize: 1,
    model: graph
});

var rb = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 40 },
    attrs: { 
	text: { text: 'An example\nof an auto-sized text block.\nDouble-click me and type.', fill: 'white', lineHeight: '1.5em', 'ref-x': 8, 'ref-y': 8, 'x-alignment': 0, 'y-alignment': 0 },
	rect: { fill: '#0f87d2', stroke: 'none' }
    }
});
graph.addCell(rb);

var tb = new joint.shapes.basic.Text({
    position: { x: 300, y: 100 },
    size: { width: 180, height: 50 },
    attrs: { text: { text: 'Edit me!', 'font-family': 'Comic Sans MS', fill: '#e86350', stroke: 'black', 'font-size': 30 } }
});
graph.addCell(tb);

tb.resize(250, 280)

var tb2 = new joint.shapes.basic.Text({
    position: { x: 650, y: 100 },
//    size: { width: 80, height: 180 },
    size: { width: 80, height: 120 },
//    attrs: { text: { text: '012\n\n345\n678', 'font-family': 'Comic Sans MS', fill: '#e86350', stroke: 'black', 'font-size': 30 } }
    attrs: { text: { text: '012\n\n345', 'font-family': 'Comic Sans MS', fill: '#e86350', stroke: 'black', 'font-size': 30 } }
});
graph.addCell(tb2);

var tr = tb2.clone();
tr.translate(0, 150).rotate(45);
graph.addCell(tr);

var tcode = new joint.shapes.basic.Text({
    position: { x: 150, y: 280 },
    size: { width: 92, height: 30 },
    attrs: { text: { text: 'function add(a, b) {\n\treturn a + b;\n}', 'font-family': 'monospace', fill: '#000000', 'font-size': 10 } }
});
graph.addCell(tcode);
tcode.resize(92 * 1.5, 30 * 1.5);

var ib = new joint.shapes.basic.Image({
    position: { x: 120, y: 170 },
    size: { width: 40, height: 40 },
    attrs: {
        text: { text: 'Editable Image Label' },
        image: { 'xlink:href': 'http://jointjs.com/images/logo.png', width: 48, height: 48 }
    }
});
graph.addCell(ib);

var rh = new joint.shapes.basic.Rhombus({
    position: { x: 350, y: 250 },
    size: { width: 100, height: 100 },
    attrs: { 
	path: { stroke: '#857099', 'stroke-width': 2, 'stroke-dasharray': '3,1' },
	text: { text: 'Rhombus', 'font-size': 15 } 
    }
});
graph.addCell(rh);


// Enable auto-sizing of the rectangle element.
// --------------------------------------------

function autosize(element) {

    var view = paper.findViewByModel(element);
    var text = view.$('text')[0];
    // Use bounding box without transformations so that our autosizing works
    // even on e.g. rotated element.
    var bbox = V(text).bbox(true);
    // 16 = 2*8 which is the translation defined via ref-x ref-y for our rb element.
    element.resize(bbox.width + 16, bbox.height + 16);
}

autosize(rb);
rb.on('change:attrs', function() { autosize(this) });

// Enable text editing.
// --------------------

var ed;
var cellViewUnderEdit;

function closeEditor() {
    
    if (ed) {
        ed.remove();
        // Re-enable dragging after inline editing.
        if (cellViewUnderEdit) {
            cellViewUnderEdit.options.interactive = true;
        }
        ed = cellViewUnderEdit = undefined;
    }
}

paper.on('cell:pointerdblclick', function(cellView, evt) {

    // Clean up the old text editor if there was one.
    closeEditor();

    var text = joint.ui.TextEditor.getTextElement(evt.target);
    if (text) {

        openEditor(text, function(newText) {
            var view = paper.findView(ed.options.text);
            view.model.attr('text/text', newText);
        });

        cellViewUnderEdit = cellView;
        // Prevent dragging during inline editing.
        cellViewUnderEdit.options.interactive = false;
    }
});

$(document.body).on('click', function(evt) {

    var text = joint.ui.TextEditor.getTextElement(evt.target);
    if (ed && !text) {

        closeEditor();
    }
});


/*
paper.on('cell:pointerdown', function(cellView) {

    var halo = new joint.ui.Halo({ cellView: cellView });
    halo.render();

    var ft = new joint.ui.FreeTransform({ cellView: cellView });
    ft.render();
});
*/

// An example on using ui.TextEditor on normal SVG text elements (outside JointJS views).
// Also, the following example shows ui.TextEditor used on a text along a path!

var along = 'M 100 200 C 200 100 300 0 400 100 C 500 200 600 300 700 200 C 800 100 900 100 900 100';
//var along = 'M 0 100 Q 30 10 100 0';

var text = V('text', { 'font-size': 40 });
text.translate(100, 450);
V(paper.viewport).append(text);
//text.text('This is a text along a path.', { textPath: along });
text.text('This is a text along a path.', { textPath: { d: along, startOffset: 80 } });


text.node.addEventListener('dblclick', function(evt) {

    closeEditor();
    openEditor(text.node, function(newText) {
        text.text(newText, { textPath: along });
    });

}, false);


var regularText = V('text', { 'font-size': 12 });
regularText.translate(300, 400);
V(paper.viewport).append(regularText);
regularText.text('This is a regular text\nnot along a path.');


regularText.node.addEventListener('dblclick', function(evt) {

    closeEditor();
    openEditor(regularText.node, function(newText) {
        regularText.text(newText);
    });

}, false);


function openEditor(text, onTextChange) {

    ed = new joint.ui.TextEditor({ text: text });
    ed.render(paper.el);

    // All the events the ui.TextEditor triggers:

    ed.on('text:change', function(newText) {
        console.log('Text changed: ' + newText);
        onTextChange(newText);
    });

    ed.on('select:change', function(selectionStart, selectionEnd) {
        var t = ed.getTextContent().substring(selectionStart, selectionEnd);
        console.log('Selection range: ', selectionStart, selectionEnd, 'text: ', t);
    });

    ed.on('caret:change', function(selectionStart) {
        console.log('Caret position: ', selectionStart);
    });

    // out-of-range events are special events that usually don't occur. The only
    // situation they can occur is when ui.TextEditor is used on a text
    // rendered along a path (see Vectorizer#text(str, { textPath: '' }))).
    // In this case, if the user moves his cursor outside the visible
    // text area, out-of-range event is triggered so that the programmer
    // has chance to react (if he wants to because these situations
    // are handled seamlessly in ui.TextEditor by hiding the caret).
    ed.on('caret:out-of-range', function(selectionStart) {
        console.log('Caret out of range: ', selectionStart);
    });

    ed.on('select:out-of-range', function(selectionStart, selectionEnd) {
        console.log('Selection out of range: ', selectionStart, selectionEnd);
    });
}
