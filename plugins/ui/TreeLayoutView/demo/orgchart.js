joint.shapes.org.Member.prototype.markup = [
    '<g class="rotatable">',
      '<g class="scalable">',
        '<rect class="card"/><image/>',
       '</g>',
       '<text class="rank"/><text class="name"/>',
    '<g class="btn add"><circle class="add"/><text class="add">+</text></g>',
    '<g class="btn del"><circle class="del"/><text class="del">-</text></g>',
    '<g class="btn edit"><rect class="edit"/><text class="edit">EDIT</text></g>',
    '</g>'].join('');

var member = function(rank, name, image, background, border) {

    var cell = new joint.shapes.org.Member({
        size: { width: 260, height: 90 },
        attrs: {
            '.card': { fill: background, stroke: border, 'stroke-width': 3 },
              image: { 'xlink:href': image, 'ref-y': 10 },
            '.rank': { text: '', 'font-size': 12, 'text-decoration': 'none', 'ref-x': 0.95, 'ref-y': 0.5, 'y-alignment': 'middle' },
            '.name': { text: '', 'ref-x': 0.95, 'ref-y': 0.62 },
            '.btn.add': { 'ref-dx': -15,'ref-y': 15, 'ref': '.card' },
            '.btn.del': { 'ref-dx': -45,'ref-y': 15, 'ref': '.card' },
            '.btn.edit': { 'ref-dx': -140,'ref-y': 5, 'ref': '.card' },
            '.btn>circle': { r: 10, fill: background, stroke: border, 'stroke-width': 3 },
            '.btn>rect': { height: 20, width: 45, rx: 2, ry: 2, fill: background, stroke: border, 'stroke-width': 1 },
            '.btn.add>text': { 'font-size': 23, 'font-weight': 800, stroke: border, x: -6.5, y: 8, 'font-family': 'Times New Roman' },
            '.btn.del>text': { 'font-size': 28, 'font-weight': 500, stroke: border, x: -4.5, y: 6, 'font-family': 'Times New Roman' },
            '.btn.edit>text': { 'font-size': 15, 'font-weight': 500, stroke: border, x: 5, y: 15, 'font-family': 'Sans Serif' }
        }
    }).on({
        'change:name': function(cell, name) {
            cell.attr('.name/text', joint.util.breakText(name, { width: 160, height: 45 }, cell.attr('.name')));
        },
        'change:rank': function(cell, rank) {
            cell.attr('.rank/text', joint.util.breakText(rank, { width: 165, height: 45 }, cell.attr('.rank')));
        }
    }).set({
        name: name,
        rank: rank
    });

    return cell;
};

function link(source, target) {

    var cell = new joint.shapes.org.Arrow({
        source: { id: source.id },
        target: { id: target.id }
    });

    return cell;
}

var members = [
    member('Founder & Chairman', 'Pierre Omidyar', 'male.png', '#ffb46c', '#333').position(100,350),
    member('President & CEO', 'Margaret C. Whitman', 'female.png', '#ff8257', '#333'),
    member('President, PayPal', 'Scott Thompson', 'male.png', '#806af4', '#333'),
    member('President, Ebay Global Marketplaces' , 'Devin Wenig', 'male.png', '#2ECC71', '#333'),
    member('Senior Vice President Human Resources', 'Jeffrey S. Skoll', 'male.png', '#1dd1c7', '#333'),
    member('Senior Vice President Controller', 'Steven P. Westly', 'male.png', '#1dd1c7', '#333')
];

var connections = [
    link(members[0], members[1]),
    link(members[1], members[2]),
    link(members[1], members[3]),
    link(members[1], members[4]),
    link(members[1], members[5])
];

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    width: 1000,
    height: 1000,
    gridSize: 1,
    model: graph,
    interactive: false,
    defaultLink: new joint.shapes.org.Arrow
});

var paperScroller = new joint.ui.PaperScroller({
    paper: paper,
    autoResizePaper: true
});

paper.on('blank:pointerdown', paperScroller.startPanning);
paperScroller.$el.css({ width: '100%', height: '100%' }).appendTo('#paper');

graph.resetCells(members.concat(connections));

var graphLayout = new joint.layout.TreeLayout({
    graph: graph,
    verticalGap: 100,
    horizontalGap: 100
});

var treeLayoutView = new joint.ui.TreeLayoutView({
    paper: paper,
    model: graphLayout,
    previewAttrs: {
        child: { rx: '50%', ry: '50%' },
        parent: { rx: 10, ry: 10 }
    }
});

graphLayout.layout();

paperScroller.zoom(-.2);
paperScroller.centerContent();

paper.on('cell:pointerup', function(cellView, evt, x, y) {

    if (V(evt.target).hasClass('add')) {

        var newMember = member('Employee', 'New Employee', 'female.png', '#f6f6f6', '#333');
        var newConnection = link(cellView.model, newMember);
        graph.addCells([newMember, newConnection]);
        graphLayout.prepare().layout();

    } else if (V(evt.target).hasClass('del')) {

        cellView.model.remove();
        graphLayout.prepare().layout();

    } else if (V(evt.target).hasClass('edit')) {

        var inspector = new joint.ui.Inspector({
            inputs: {
                'rank': {
                    type: 'text',
                    label: 'Rank',
                    index: 1
                },
                'name': {
                    type: 'text',
                    label: 'Name',
                    index: 2
                },
                'attrs/image/xlink:href': {
                    type: 'select',
                    label: 'Sex',
                    options: [
                        { value: 'male.png', content: 'Male' },
                        { value: 'female.png', content: 'Female' }
                    ],
                    index: 3
                }
            },
            cellView: cellView
        });

        var dialog = new joint.ui.Dialog({
	    width: 250,
	    title: 'Edit Member',
	    content: inspector.render().el
        });

        dialog.on('ation:close', inspector.remove, inspector);
        dialog.open();
    }
});
