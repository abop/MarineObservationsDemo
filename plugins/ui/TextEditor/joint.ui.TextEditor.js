// ui.TextEditor
// =============

// Inline SVG text editing that is nearly identical to the native text
// editing inside the HTML textarea element.

// Features:
// ---------

// - Positioning caret at a specific position.
// - Caret positioning left or right based on the distance to 
//   the left/right edge of the clicked character.
// - Handles newlines seamlessly.
// - Selections, both all-text and portions of text.
// - Word selection by double-click.
// - Keyboard navigation native to the underlying OS.
// - API for programmatic access (selections, caret, word boundary, ...).
// - Selection boxes and caret can be styled in CSS.
// - Supports editing of a rotated text.
// - Supports editing of a scaled text.

// Important note: The ui.TextEditor assumes the SVG `<text>` element
// contains a `<tspan>` element for each line. Lines are ordered as they
// appear in the DOM. If a line is empty, it is assumed the `<tspan>`
// element contains a space character.
// This is in line with how Vectorizer renders text.

joint.ui.TextEditor = Backbone.View.extend({

    className: 'text-editor',

    events: {
	'change textarea': 'onDone',
	'keyup textarea': 'onInput'
    },

    initialize: function(options) {
	
        _.bindAll(this, 'onMousedown', 'onMousemove', 'onMouseup', 'onDoubleClick');

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        var elText = this.options.text;
        $(elText).on('mousedown', this.onMousedown);
        $(elText).on('mousemove', this.onMousemove);
        $(elText).on('dblclick', this.onDoubleClick);
        $(document.body).on('mouseup', this.onMouseup);
    },

    // @public
    render: function(root) {

        // The caret (cursor), displayed as a thin <div> styled in CSS.
	this.$caret = $('<div>', { 'class': 'caret' });

        // The container for selection boxes.
	this.$selection = $('<div>');
        // One selection box covering one character.
	this.$selectionBox = $('<div>', { 'class': 'char-selection-box' });
	this.$el.append(this.$caret, this.$selection);

        this.$textareaContainer = $('<div>', { 'class': 'textarea-container' });

	this.textarea = $('<textarea>', {
            autocorrect: 'off',
            autocomplete: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
            tabindex: '0'
        })[0];

        this.textarea.value = this.getTextContent();
	this.$textareaContainer.append(this.textarea);
        this.$el.append(this.$textareaContainer);

        // First add the container element to the `<body>`, otherwise
        // the `focus()` called afterwords would not work.
	$(root || document.body).append(this.$el);

        var bbox = V(this.options.text).bbox();
        this.$textareaContainer.css({
	    left: bbox.x,
            top: bbox.y
        });

	this.textarea.focus();

        // TODO: This should be optional?
        V(this.options.text).attr('cursor', 'text');

        this.selectAll();

        return this;
    },

    onInput: function() {

	var content = this.textarea.value;
	this.trigger('text:change', content);

        this.deselect();
	this.setCaret();
    },

    onMousedown: function(evt) {

        // Start a mouse selection.
        this._selectionStart = this.getCharNumFromEvent(evt);
        this.deselect();
        this.setCaret(this._selectionStart);
        this.trigger('caret:change', this.textarea.selectionStart);

        // Prevent default action that could set focus
        // on the text element and therefore the textarea
        // inside the editor would loose it.
        evt.preventDefault();
        // Stop propagation, the active text editor takes over mousedown.
        evt.stopPropagation();
    },

    onMousemove: function(evt) {

        if (typeof this._selectionStart !== 'undefined') {

            this.hideCaret();
            this.deselect();

            var selectionEnd = this.getCharNumFromEvent(evt);

            if (this._selectionStart === selectionEnd) {

                this.setCaret(this._selectionStart);
                this.trigger('caret:change', this.textarea.selectionStart);

            } else {

                this.select(this._selectionStart, selectionEnd);

                this.trigger('select:change', this.textarea.selectionStart, this.textarea.selectionEnd);
            }

            // The active text editor takes over mousemove during selection.
            evt.preventDefault();
            evt.stopPropagation();
        }
    },

    onMouseup: function(evt) {

        if (typeof this._selectionStart !== 'undefined') {
            
            this._selectionStart = undefined;
        }
    },

    onDoubleClick: function(evt) {

        this.hideCaret();
        var wordBoundary = this.getWordBoundary(this.getCharNumFromEvent(evt));
        this.select(wordBoundary[0], wordBoundary[1]);
        this.trigger('select:change', this.textarea.selectionStart, this.textarea.selectionEnd);

        evt.preventDefault();
        evt.stopPropagation();
    },

    // @public
    // Return the text content (including new line characters) inside the `<text>` SVG element.
    // We assume that each <tspan> represents a new line in the order in which
    // they were added to the DOM.
    getTextContent: function() {

	// Add a newline character for every <tspan> that is a line. Such
        // tspans must be marked with the `line` class.
	var elText = this.options.text;
	var tspans = V(elText).find('.line');
        return tspans.length === 0 ? elText.textContent : _.reduce(tspans, function(memo, tspan, i, tspans) {
            var line = tspan.textContent;
            // Empty lines are assumed to be marked with the `empty-line` class.
            if (V(tspan).hasClass('empty-line')) line = '';
            // Last line does not need a new line (\n) character at the end.
	    return (i === tspans.length - 1) ? memo + line : memo + line + '\n';
	}, '');
    },

    // @public
    // Select the whole text.
    selectAll: function() {

        return this.select(0, this.getNumberOfChars());
    },

    // @public
    // Select a portion of the text starting at `selectionStart`
    // character position ending at `selectionEnd` character position.
    // This method automatically swaps `selectionStart` and `selectionEnd`
    // if they are in a wrong order.
    select: function(selectionStart, selectionEnd) {

        // Normalize if necessary.
        if (selectionStart > selectionEnd) {

            var _selectionStart = selectionStart;
            selectionStart = selectionEnd;
            selectionEnd = _selectionStart;
        }

        this.$selection.empty();

        var fontSize = this.getFontSize();
        var t = this.getTextTransforms();
        var angle = t.rotation;

        var bbox;
        for (var i = selectionStart; i < selectionEnd; i++) {
            
            var $box = this.$selectionBox.clone();
            // `getCharBBox()` can throw an exception in situations where
            // the character position is outside the range where
            // the `getStartPositionOfChar()` and `getEndPositionOfChar()`
            // methods can operate. An example of this is a text along a path
            // that is shorter than that of the text. In this case,
            // we fail silently. This is safe because the result of this
            // is selection boxes not being rendered for characters
            // outside of the visible text area - which is actually desired.
            try {
                bbox = this.getCharBBox(i);
            } catch (e) { 
                this.trigger('select:out-of-range', selectionStart, selectionEnd);
                break; 
            }

            // Using font size instead of bbox.height makes the bounding box
            // of the character more precise. Unfortunately, getting an accurate
            // bounding box of a character in SVG is not easy.
            $box.css({
                left: bbox.x,
                top: bbox.y - fontSize * t.scaleY,
                width: bbox.width,
                height: fontSize * t.scaleY,
                '-webkit-transform': 'rotate(' + angle + 'deg)',
                '-webkit-transform-origin': '0% 100%',
                '-moz-transform': 'rotate(' + angle + 'deg)',
                '-moz-transform-origin': '0% 100%'
            });
            this.$selection.append($box);
        }

        this.textarea.selectionStart = selectionStart;
        this.textarea.selectionEnd = selectionEnd;

        if (bbox) {

            this.$textareaContainer.css({
	        left: bbox.x,
                top: bbox.y - fontSize * t.scaleY
            });
        }

        this.textarea.focus();

        return this;
    },

    // @public
    // Cancel selection of the text.
    deselect: function() {

        this.$selection.empty();
        return this;
    },

    // @public
    // Return the start and end character positions for a word
    // under `charNum` character position.
    getWordBoundary: function(charNum) {

        var text = this.textarea.value;
        var re = /\W/;

        var start = charNum;
        while (start) {
            if (re.test(text[start])) {
                start += 1;
                break;
            }
            start -= 1;
        }

        var numberOfChars = this.getNumberOfChars();
        var end = charNum;
        while (end <= numberOfChars) {
            if (re.test(text[end])) {
                break;
            }
            end += 1;
        }

        return [start, end];
    },

    // Get the bounding box (in screen coordinates) of the character 
    // under `charNum` position (the real one, not the SVG one).
    getCharBBox: function(charNum) {

        // For a newline character (line ending), return a bounding box
        // that is derived from the previous - non newline - character
        // and move it to the right of that character.
        if (this.isLineEnding(charNum)) {
            var bbox = this.getCharBBox(charNum - 1);
            //bbox.x = bbox.x + bbox.width + -7;
            bbox.x = bbox.x2;
            bbox.y = bbox.y2;
            bbox.width = this.options.newlineCharacterBBoxWidth || 10;
            return bbox;
        }

        var svgCharNum = this.realToSvgCharNum(charNum);
        var elText = this.options.text;
        var startPosition = elText.getStartPositionOfChar(svgCharNum);
        var endPosition = elText.getEndPositionOfChar(svgCharNum);
        var extent = elText.getExtentOfChar(svgCharNum);

        startPosition = this.localToScreenCoordinates(startPosition);
        endPosition = this.localToScreenCoordinates(endPosition);

        var t = this.getTextTransforms();
        var x = startPosition.x;
        var y = startPosition.y;
        var w = extent.width * t.scaleX;
        var h = extent.height * t.scaleY;

        return { x: x, y: y, width: w, height: h, x2: endPosition.x, y2: endPosition.y };
    },

    realToSvgCharNum: function(charNum) {
        // Calculate the position of the character in the SVG `<text>` element.
        // The reason why those two don't match (`charNum` and `svgCharNum`) is
        // because in the SVG `<text>` element, there are no newline characters.
        var lineEndings = 0;
        for (var i = 0; i <= charNum; i++) {
            if (this.isLineEnding(i)) {
                lineEndings += 1;
            }
        }

        return charNum - lineEndings;
    },

    selectionStartToSvgCharNum: function(selectionStart) {
        
        return selectionStart - this.nonEmptyLinesBefore(selectionStart);
    },

    // Return `true` if the character at the position `charNum` is
    // a newline character but does not denote an empty line.
    // In other words, the newline character under `charNum` is
    // ending a non-empty line.
    isLineEnding: function(charNum) {

        var text = this.textarea.value;

        if (text[charNum] === '\n' && charNum > 0 && text[charNum - 1] !== '\n') {
            return true;
        }
        return false;
    },

    svgToRealCharNum: function(svgCharNum) {

        var text = this.textarea.value;
        var newLinesBefore = 0;
        for (var i = 0; i <= svgCharNum + newLinesBefore; i++) {
            if (this.isLineEnding(i)) {
                newLinesBefore += 1;
            }
        }
        return svgCharNum + newLinesBefore;
    },

    localToScreenCoordinates: function(p) {

        p = V.createSVGPoint(p.x, p.y);
	//var screenCTM = this.options.text.getScreenCTM();
        var screenCTM = this.options.text.getCTM();
        return p.matrixTransform(screenCTM);
    },

    // @public
    // Return the number of characters in the text.
    getNumberOfChars: function() {

        return this.getTextContent().length;
    },

    // @public
    // Return the character position (the real one) the user clicked on.
    // If there is no such a position found, return the last one.
    getCharNumFromEvent: function(evt) {

        var elText = this.options.text;
        var clientX = evt.clientX;
        var clientY = evt.clientY;
        var svgCharNum = elText.getCharNumAtPosition(V(elText).toLocalPoint(clientX, clientY));

        // The user clicked somewhere outside, always return the last char num.
        if (svgCharNum < 0) {

            return this.getNumberOfChars();
        }

        // If the user clicked on the "left" side of the character,
        // return the character position of the clicked character, otherwise
        // return the character position of the character after the clicked one.
        var bbox = this.getCharBBox(this.svgToRealCharNum(svgCharNum));
        if (Math.abs(bbox.x - clientX) < Math.abs(bbox.x + bbox.width - clientX)) {
            
            return this.svgToRealCharNum(svgCharNum);
        } 

        return this.svgToRealCharNum(svgCharNum) + 1;
    },

    lineNumber: function(selectionStart) {

        var text = this.textarea.value;
        var n = 0;
        for (var i = 0; i < selectionStart; i++) {
            if (text[i] === '\n') {
                n += 1;
            }
        }
        return n;
    },

    emptyLinesBefore: function(selectionStart) {

        var lines = this.textarea.value.split('\n');
        var lineNumber = this.lineNumber(selectionStart);
        var n = 0;
        for (var i = lineNumber - 1; i >= 0; i--) {
            if (!lines[i]) {
                n += 1;
            }
        }
        return n;
    },
    
    nonEmptyLinesBefore: function(selectionStart) {

        return this.lineNumber(selectionStart) - this.emptyLinesBefore(selectionStart);
    },

    isEmptyLine: function(lineNumber) {

        var lines = this.textarea.value.split('\n');
        return !lines[lineNumber];
    },

    isEmptyLineUnderSelection: function(selectionStart) {
        
        var lineNumber = this.lineNumber(selectionStart);
        return this.isEmptyLine(lineNumber);
    },

    getTextTransforms: function() {

        var screenCTM = this.options.text.getCTM();
        return V.decomposeMatrix(screenCTM);
    },

    getFontSize: function() {

        return parseInt(V(this.options.text).attr('font-size'), 10);
    },

    // @public
    // Set the caret position based on the selectionStart of the textarea unless
    // `charNum` is provided in which case the caret will be set just before the
    // character at `charNum` position (starting from 0).
    setCaret: function(charNum) {

	var elText = this.options.text;
	var numberOfChars = this.getNumberOfChars();
	var selectionStart = this.textarea.selectionStart;
        var text = this.textarea.value;

        if (typeof charNum !== 'undefined') {

            selectionStart = this.textarea.selectionStart = this.textarea.selectionEnd = charNum;
        }

        // console.log('selectionStart', selectionStart, 'isLineEnding', this.isLineEnding(selectionStart), 'isEmptyLineUnderSelection', this.isEmptyLineUnderSelection(selectionStart), 'svgCharNum', this.selectionStartToSvgCharNum(selectionStart), 'nonEmptyLinesBefore', this.nonEmptyLinesBefore(selectionStart));

        var caretPosition;

        // `getStartPositionOfChar()` or `getEndPositionOfChar()` can throw an exception 
        // in situations where the character position is outside the range of
        // the visible text area. In this case, we just hide the caret altogether - 
        // which is desired because the user is editing a text that is not visible.
        // An example of this is a text along a path that is shorter than that of the text.
        try {

            // - If we're on an empty line, always take the start position of the
            //   SVG space character on that line.
            // - If we're at the end of the line, take the end position of the SVG character before.
            // - If we're at the end of the text, also take the end position of the character before.
            // - For all other cases, take the start position of the SVG character before the selection.
            if (!this.isEmptyLineUnderSelection(selectionStart) && (this.isLineEnding(selectionStart) || text.length === selectionStart)) {

                // console.log(selectionStart + ' => END (' + (this.selectionStartToSvgCharNum(selectionStart) - 1) + ')');
                
                caretPosition = elText.getEndPositionOfChar(this.selectionStartToSvgCharNum(selectionStart) - 1);

            } else {

                // console.log(selectionStart + ' => START (' + this.selectionStartToSvgCharNum(selectionStart) + ')');

                caretPosition = elText.getStartPositionOfChar(this.selectionStartToSvgCharNum(selectionStart));
            }

        } catch (e) { 

            this.trigger('caret:out-of-range', selectionStart);
            this.$caret.hide(); 
            return this;
        }

	// Convert the caret local position (in the coordinate system of the SVG `<text>`) 
        // into screen coordinates.
	var caretScreenPosition = this.localToScreenCoordinates(caretPosition);

	// Set the position of the caret. If the number of characters is zero, the caretPosition
	// is `{ x: 0, y: 0 }`, therefore it is not the the bottom right corner of the character but
	// the top left. Therefore, we do not want to shift the caret up using the `margin-top` property.
	var fontSize = this.getFontSize();
        var t = this.getTextTransforms();
        var angle = t.rotation;

	this.$caret.css({ 
	    left: caretScreenPosition.x,
            top: caretScreenPosition.y + (numberOfChars ? -fontSize * t.scaleY : 0),
	    height: fontSize * t.scaleY,
            '-webkit-transform': 'rotate(' + angle + 'deg)',
            '-webkit-transform-origin': '0% 100%',
            '-moz-transform': 'rotate(' + angle + 'deg)',
            '-moz-transform-origin': '0% 100%'
	}).show();

        this.$textareaContainer.css({
	    left: caretScreenPosition.x,
            top: caretScreenPosition.y + (numberOfChars ? -fontSize * t.scaleY : 0)
        });

        // Always focus. If the caret was set as a reaction on
        // mouse click, the textarea looses focus in FF.
	this.textarea.focus();

        return this;
    },

    // @public
    // Hide the caret (cursor).
    hideCaret: function() {

        this.$caret.hide();
        return this;
    },

    remove: function() {
        
        var elText = this.options.text;
        $(elText).off('mousedown', this.onMousedown);
        $(elText).off('mousemove', this.onMousemove);
        $(elText).off('dblclick', this.onDoubleClick);
        $(document.body).off('mouseup', this.onMouseup);

        // TODO: Optional?
        V(this.options.text).attr('cursor', '');        

        Backbone.View.prototype.remove.apply(this, arguments);
    },

    onDone: function() {

	this.$el.remove();
    }
}, {
    
    // A tiny helper that checks if `el` is an SVG `<text>` or `<tspan>` element
    // and returns it if yes, otherwise it returns `undefined`.
    // Especially useful when working with events, e.g.:
    // $(document.body).on('click', function(evt) {
    //     var t = joint.ui.TextEditor.getTextElement(evt.target);
    //     if (t) { ... } else { ... }
    // })
    getTextElement: function(el) {

        var tagName = el.tagName.toUpperCase();

        if (tagName === 'TEXT' || tagName === 'TSPAN' || tagName === 'TEXTPATH') {

            if (tagName === 'TEXT') return el;
            return this.getTextElement(el.parentNode);
        }
        
        return undefined;
    }
});
