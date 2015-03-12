// Redefining default views making them much more lightweight.
// ===========================================================


joint.dia.LightElementView = joint.dia.ElementView.extend({

    node: V('<g><text font-size="10" transform="translate(0, 0)">Label</text><ellipse rx="2" ry="2" fill="white" stroke="black"/></g>'),

    initialize: function() {

        joint.dia.CellView.prototype.initialize.apply(this, arguments);
        
        V(this.el).attr({
            
            'class': 'element ' + this.model.get('type').split('.').join(' '),
            'model-id': this.model.id
        });

        this.model.on('change:position', this.translate, this);
    },
    
    render: function() {

        var node = this.node.clone();
        var attrs = this.model.get('attrs');
        var label = attrs.text.text;
        var fill = attrs && attrs.ellipse && attrs.ellipse.fill || '#F1C40F';
        var width = this.model.get('width');
        var height = this.model.get('height');
        
        V(node.node.firstChild).text(label);
        V(node.node.firstChild).translate(0, (-height/2 - 12) || -20);

        V(node.node.lastChild).attr({
            rx: width/2 || 2,
            ry: height/2 || 2,
            stroke: 'white',
            fill: fill
        });
        
        V(this.el).append(node);

        this.translate();
    },

    update: function() {
        // noop
    }
});


joint.dia.LightLinkView = joint.dia.LinkView.extend({

    node: V('<line stroke="gray" fill="none" />'),

    initialize: function() {
        
        joint.dia.CellView.prototype.initialize.apply(this, arguments);
        
        V(this.el).attr({ 'class': 'link', 'model-id': this.model.id });
        
        // this.throttledUpdate = _.bind(_.throttle(this.update, 10), this);
    },
    
    render: function() {

        var node = this.node.clone();

        this._sourceModel = this.paper.getModelById(this.model.get('source').id);
        this._targetModel = this.paper.getModelById(this.model.get('target').id);
        
        this._lineNode = V(node.node);

        var attrs = this.model.get('attrs');
        if (attrs && attrs.line)
            this._lineNode.attr(attrs.line);
        
        this._sourceModel.on('change:position', this.update);
        this._targetModel.on('change:position', this.update);
        
        this.update();

        V(this.el).append(node);
    },

    update: function() {

        var sourcePosition = this._sourceModel.get('position');
        var targetPosition = this._targetModel.get('position');

        if (sourcePosition && targetPosition) {

            this._lineNode.node.setAttribute('x1', sourcePosition.x);
            this._lineNode.node.setAttribute('y1', sourcePosition.y);
            this._lineNode.node.setAttribute('x2', targetPosition.x);
            this._lineNode.node.setAttribute('y2', targetPosition.y);
        }
    }
});

