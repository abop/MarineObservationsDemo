joint.ui.Dialog = Backbone.View.extend({
    
    className: 'dialog',

    events: {
	'click .bg': 'action',
	'click .btn-close': 'action',
	'click .controls button': 'action',
	'mousedown .titlebar': 'onDragStart',
	'touchstart .titlebar': 'onDragStart'
    },

    options: {
	draggable: false,
	closeButtonContent: '&times;',
	closeButton: true,
	inlined: false,
	modal: true
    },

    initialize: function(options) {

	_.bindAll(this, 'onDrag', 'onDragEnd');

	this.options = _.extend({}, _.result(this, 'options'), options || {});
    },
    
    render: function() {

	var $bg = $('<div/>', { 'class': 'bg', 'data-action': 'close' });
	var $fg = $('<div/>', { 'class': 'fg' });
	var $titlebar = $('<div/>', { 'class': 'titlebar' });
	var $body = $('<div/>', { 'class': 'body' });
	var $btnClose = $('<button/>', { 'class': 'btn-close', 'data-action': 'close', html: this.options.closeButtonContent });
	var $controls = $('<div/>', { 'class': 'controls' });

	this.$el.toggleClass('draggable', !!this.options.draggable);

	if (this.options.type) {
	    this.$el.attr('data-type', this.options.type);
	}

	if (this.options.inlined) {
	    this.$el.addClass('inlined');
	}

	if (this.options.modal) {
	    this.$el.addClass('modal');
	}

	if (this.options.width) {
	    $fg.width(this.options.width);
	}

	if (this.options.title) {
	    $titlebar.append(this.options.title);
	} else {
	    $titlebar.addClass('empty');
	}

	if (this.options.content) {
	    $body.append(this.options.content);
	}

	if (this.options.buttons) {

	    _.each(this.options.buttons.reverse(), function(button) {

		var $button = $('<button/>', { 
		    'class': 'control-button', 
		    html: button.content,
		    'data-action': button.action
		});

		// Currently only `'left'` position is supported. If 
		// no position is passed, it is considered to be `'right'`.
		if (button.position) {
		    $button.addClass(button.position);
		}

		$controls.append($button);
	    });
	}

	$fg.append($titlebar, $body, $controls);

	if (this.options.closeButton) {
	    $fg.append($btnClose);
	}

	this.$el.empty().append($bg, $fg);

	return this;
    },

    open: function(el) {

	// Events might have been undelegated by a previous `close()` call.
	this.delegateEvents();

	this.on('action:close', this.close, this);

        $(document.body).on({
            'mousemove.dialog touchmove.dialog': this.onDrag,
            'mouseup.dialog touchend.dialog': this.onDragEnd
        });

	$(el || document.body).append(this.render().el);
	return this;
    },

    close: function() {

	this.remove();
	return this;
    },

    remove: function() {

        Backbone.View.prototype.remove.apply(this, arguments);
        $(document.body).off('.dialog', this.onDrag).off('.dialog', this.onDragStart);
    },

    action: function(evt) {

	var $button = $(evt.target).closest('[data-action]');
	var action = $button.attr('data-action');
	if (action) {

	    this.trigger('action:' + action);
	}
    },

    onDragStart: function(evt) {

	if (this.options.draggable) {

            evt = joint.util.normalizeEvent(evt);

	    this._dx = evt.clientX;
	    this._dy = evt.clientY;
	    this._dragging = true;
	}
    },
    onDrag: function(evt) {

	if (this._dragging) {

            evt = joint.util.normalizeEvent(evt);

	    var $fg = this.$('.fg');
	    var offset = $fg.offset();
	    $fg.css({
		top: offset.top + (evt.clientY - this._dy),
		left: offset.left + (evt.clientX - this._dx),
		margin: 0
	    });

	    this._dx = evt.clientX;
	    this._dy = evt.clientY;
	}
    },
    onDragEnd: function() {

	this._dragging = false;
    }
});
