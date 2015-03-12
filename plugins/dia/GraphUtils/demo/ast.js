var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ 
    width: 1000, 
    height: 1000, 
    gridSize: 1, 
    model: graph,
    async: { batchSize: 50 }
});

var paperScroller = new joint.ui.PaperScroller({ paper: paper });
paperScroller.$el.appendTo('#paper');

// Mouse scroll-based zoom.
$('.paper-scroller').on('mousewheel DOMMouseScroll', function(evt) {
    if (evt.altKey) {
        evt.preventDefault();
        var delta = Math.max(-1, Math.min(1, (evt.originalEvent.wheelDelta || -evt.originalEvent.detail)));
        delta = delta/5;
	var offset = paperScroller.$el.offset();
	var o = paperScroller.toLocalPoint(evt.pageX - offset.left, evt.pageY - offset.top);
        paperScroller.zoom(delta, { min: 0.2, max: 5, ox: o.x, oy: o.y });
    }
});

// Enable panning.
paper.on('blank:pointerdown', function(evt, x, y) {
    paperScroller.startPanning(evt, x, y);
});


var renderStartTime;

//paper.on('render:done', printStats);

function printStats() {
    console.log('rendering time', ((new Date()).getTime() - renderStartTime.getTime()) + ' ms');
    console.log('cells: ' + graph.get('cells').length + ', elements: ' + graph.getElements().length + ', links: ' + graph.getLinks().length);
}

// Construct the JointJS elements and links out of the AST.
// --------------------------------------------------------

// TODO: ForStatement, ForOfStatement

function getChildren(node) {

    switch (node.type) {
    case 'Program':
	return node.body;
    case 'VariableDeclaration':
	return node.declarations;
    case 'VariableDeclarator':
	return node.init ? [node.id, node.init] : [node.id];
    case 'ExpressionStatement':
	return [node.expression];
    case 'BinaryExpression':
	return [node.left, node.right];
    case 'AssignmentExpression':
	return [node.left, node.right];
    case 'CallExpression':
	return [node.callee, { type: 'arguments', arguments: node.arguments }];
    case 'arguments':
	return node.arguments;
    case 'MemberExpression':
	return [node.object, node.property];
    case 'NewExpression':
	return node.arguments;
    case 'ObjectExpression':
	return node.properties;
    case 'Property':
	return [node.key, node.value];
    case 'FunctionDeclaration':
	return [node.body];
    case 'FunctionExpression':
	return [node.body];
    case 'BlockStatement':
	return node.body;
    case 'ReturnStatement':
	return node.argument ? [node.argument] : [];
    case 'UnaryExpression':
	return [node.argument];
    case 'IfStatement':
	return [node.test, node.consequent];
    case 'ConditionalExpression':
	return [node.test, node.consequent, node.alternate];
    default:
	return [];
    }
}

function getLabel(node) {

    switch (node.type) {
    case 'Identifier':
	return node.name;
    case 'Literal':
	return node.raw;
    case 'UnaryExpression':
	return node.operator;
    case 'BinaryExpression':
	return node.operator;
    case 'AssignmentExpression':
	return node.operator;
    case 'FunctionDeclaration':
	return 'function ' + (node.id && node.id.name || '') + '(' + _.pluck(node.params, 'name').join(',') + ')';
    case 'FunctionExpression':
	return 'function ' + (node.id && node.id.name || '') + '(' + _.pluck(node.params, 'name').join(',') + ')';
    default:
	return node.type;
    }
}

function getElementColor(node) {

    var color = ({
	
	'Program': 'black',
	'VariableDeclarator': '#414141',
	'arguments': '#63c1f1',
	'BinaryExpression': '#fcbc2a',
	'UnaryExpression': '#fcbc2a',
	'AssignmentExpression': '#fcbc2a',
	'Identifier': '#ff5246',
	'Literal': '#77c63d'

    })[node.type];

    return color || '#232323';
}

var program;

// This is a JointJS Link less of almost all the features JointJS links have.
// We don't need these features and so we trade them for much better performance
// for large graphs.
var FastLink = joint.dia.Link.extend({
    markup: '<path class="connection" stroke="gray" fill="none" d=""/>'
});

function displayTree() {

    program = $('#program').val();
    var syntax = esprima.parse(program, {
	loc: true,
	range: true,
	raw: true,
	tokens: true,
	comment: true
    });

    var cells = graph.constructTree(syntax, {
	children: getChildren,
	makeElement: function(node) {
	    return new joint.shapes.basic.Rect({
		size: { width: 80, height: 30 },
		attrs: { 
		    text: { text: getLabel(node), fill: 'white', 'font-size': 8 },
		    rect: { fill: getElementColor(node), rx: 5, ry: 5, stroke: 'none' }
		},
		node: node
	    });
	},
	makeLink: function(parentElement, childElement) {
	    return new joint.dia.Link({
	    //return new FastLink({
		source: { id: parentElement.id },
		target: { id: childElement.id },
		attrs: {
		    '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' }
		}
	    });
	}
    });
    renderStartTime = new Date;
    graph.resetCells(cells);

    $('#stats .stats-n-nodes').text(graph.getElements().length);
    $('#stats .stats-n-tokens').text(syntax.tokens.length);
    $('#stats .stats-tokens').empty();
    _.each(syntax.tokens, function(token) {
	var $li = $('<li/>', {
	    text: token.type + '(',
	    'data-range': JSON.stringify(token.range)
	});
	$li.append($('<span/>', { text: token.value }));
	$li.append(')');
	$('#stats .stats-tokens').append($li);
    });
}

// Layout the tree.
// ----------------

// Fit paper area to the content once all the transitions have finished.
var fitToContent = _.debounce(function() {
    paper.fitToContent();
}, 100);

function layout() {

    joint.layout.DirectedGraph.layout(graph, {
	rankDir: $('.toggle-layout-direction input').is(':checked') ? 'LR' : 'TB',
	setLinkVertices: false,
	setPosition: function(cell, position) {
	    cell.transition('position/x', position.x - position.width/2);
	    cell.transition('position/y', position.y - position.height/2);
	    cell.on('transition:end', fitToContent);
	}
    });
}

// Show/hide subtree on cell click.
// --------------------------------

var subtrees = {};

paper.on('cell:pointerclick', function(cellView, evt, x, y) {

    var cell = cellView.model;
    console.log(cell.get('node'));

    if (subtrees[cell.id]) {

	graph.addCells(subtrees[cell.id].sort(function(a, b) {
	    return (a instanceof joint.dia.Link) ? 1 : -1;
	}));
	delete subtrees[cell.id];
	return layout();
    }

    function store(cell) {
	(subtrees[cellView.model.id] || (subtrees[cellView.model.id] = [])).push(cell);
    }

    graph.on('remove', store);

    removeSubtree(cellView.model);
    layout();

    graph.off('remove', store);
});

function removeSubtree(element) {

    _.each(graph.getConnectedLinks(element, { outbound: true }), function(link) {

	var target = graph.getCell(link.get('target').id);
	removeSubtree(target);
	target.remove();
    });
}

// UI
// --

function loadProgram(program) {

    var code = $('#program-' + program).text();
    $('#program').val(code);
    codeEditor.setValue(code);
    displayTree();
    layout();
}

$('#select-program').on('change', function() {
    loadProgram($(this).val());
});

var codeEditor = CodeMirror.fromTextArea(document.getElementById('program'), {
    lineNumbers: true,
    mode: "javascript"
});
codeEditor.on('change', function() { $('#program').val(codeEditor.getValue()); });

loadProgram('function');

$('#btn-clear').on('click', function() { 
    graph.clear(); 
    $('#program').val(''); 
    codeEditor.setValue('');
    $('.stats-tokens').empty();
});
$('#btn-visualize').on('click', function() { displayTree(); layout(); });
$('.toggle-layout-direction input').on('change', layout);

$('#btn-export-svg').on('click', function() { paper.openAsSVG(); console.log(paper.toSVG()) });
$('#btn-export-png').on('click', function() { paper.openAsPNG(); });

var tooltip = new joint.ui.Tooltip({
    rootTarget: '#paper',
    target: '.element',
    content: function(element) {
	var cell = paper.findView(element).model;
	var node = cell.get('node');
	var snippet = node.range ? program.substring(node.range[0], node.range[1]) : '';
	return '<b>' + node.type + '</b>' + snippet.replace(/\n/g, '<br/>').replace(/\ /g, '&nbsp;');
    },
    direction: 'left',
    padding: 20
});

var tokenMarker;

$('.stats-tokens').on('mouseenter', 'li', function() {
    var $li = $(this).closest('li');
    var range = $li.data('range');
    tokenMarker = codeEditor.markText(codeEditor.posFromIndex(range[0]), codeEditor.posFromIndex(range[1]), {
	className: 'syntax-token'
    });
});
$('.stats-tokens').on('mouseleave', 'li', function() {
    if (tokenMarker) tokenMarker.clear();
});


var source = graph.getElements()[0];
var target = graph.getElements()[19];
var path = graph.shortestPath(source, target);
_.each(path, function(el) {
    paper.findViewByModel(el).highlight();
    el.attr('rect/fill', 'green');
    el.resize(100, 30);
});
source.attr('rect/fill', 'blue');
//target.attr('rect/fill', 'blue');
