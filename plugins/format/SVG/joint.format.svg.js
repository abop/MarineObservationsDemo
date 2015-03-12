joint.dia.Paper.prototype.toSVG = function(callback, opt) {

    opt = opt || {};

    // `viewportBbox` contains the real bounding box of the elements in the diagram, 'whitespace trimmed'.
    // Unfortunately, Firefox returns `x = 0` and `y = 0` even though there is a whitespace between
    // the left edge of the SVG and the leftmost element.
    // var viewportBbox = this.viewport.getBBox();

    var viewportTransform = V(this.viewport).attr('transform');
    V(this.viewport).attr('transform', '');

    var viewportBbox = this.getContentBBox();

    // We'll be modifying `style` and `transform` attribute of elements/nodes. Therefore,
    // we're making a deep clone of the whole SVG document.
    var svgClone = this.svg.cloneNode(true);

    V(this.viewport).attr('transform', viewportTransform || '');

    // We're removing css styles from the svg container. (i.e backround-image)
    svgClone.removeAttribute('style');

    // When all elements are shifted towards the origin (0,0), make the SVG dimensions as small
    // as the viewport. Note that those are set in the `viewBox` attribute rather then in the
    // `width`/`height` attributes. This allows for fitting the svg element inside containers.
    if (opt.preserveDimensions) {

        V(svgClone).attr({
            width: viewportBbox.width,
            height: viewportBbox.height
        });

    } else {

        V(svgClone).attr({ width: '100%', height: '100%' });
    }

    // Set SVG viewBox starting at top-leftmost element's position (viewportBbox.x|y).
    // We're doing this because we want to trim the `whitespace` areas of the SVG making its size
    // as small as necessary.
    V(svgClone).attr('viewBox', viewportBbox.x + ' ' + viewportBbox.y + ' ' + viewportBbox.width + ' ' + viewportBbox.height);

    // Now the fun part. The code below has one purpuse and i.e. store all the CSS declarations
    // from external stylesheets to the `style` attribute of the SVG document nodes.
    // This is achieved in three steps.
    
    // 1. Disabling all the stylesheets in the page and therefore collecting only default style values.
    //    This, together with the step 2, makes it possible to discard default CSS property values
    //    and store only those that differ.
    // 2. Enabling back all the stylesheets in the page and collecting styles that differ from the default values.
    // 3. Applying the difference between default values and the ones set by custom stylesheets
    //    onto the `style` attribute of each of the nodes in SVG.

    // Note that all of this would be much more simplified if `window.getMatchedCSSRules()` worked
    // in all the supported browsers. Pity is that it doesn't even work in WebKit that 
    // has it (https://bugzilla.mozilla.org/show_bug.cgi?id=438278).
    // Pollyfil for Firefox can be https://gist.github.com/ydaniv/3033012;


    var styleSheetsCount = document.styleSheets.length;
    var styleSheetsCopy = [];

    // 1. 
    for (var i = styleSheetsCount - 1; i >= 0; i--) {

	// There is a bug (bugSS) in Chrome 14 and Safari. When you set stylesheet.disable = true it will
	// also remove it from document.styleSheets. So we need to store all stylesheets before
	// we disable them. Later on we put them back to document.styleSheets if needed.
	// See the bug `https://code.google.com/p/chromium/issues/detail?id=88310`.
	styleSheetsCopy[i] = document.styleSheets[i];

	document.styleSheets[i].disabled = true;
    }
    
    var defaultComputedStyles = {};
    $(this.svg).find('*').each(function(idx) {

        var computedStyle = window.getComputedStyle(this, null);
        // We're making a deep copy of the `computedStyle` so that it's not affected
        // by that next step when all the stylesheets are re-enabled again.
        var defaultComputedStyle = {};
        _.each(computedStyle, function(property) { defaultComputedStyle[property] = computedStyle.getPropertyValue(property); });
        
        defaultComputedStyles[idx] = defaultComputedStyle;
    });


    // bugSS: Check whether the stylesheets have been removed from document.styleSheets
    if (styleSheetsCount != document.styleSheets.length) {
	// bugSS: Copy all stylesheets back
	_.each(styleSheetsCopy, function(copy, i) { document.styleSheets[i] = copy; });
    }

    // 2.

    // bugSS: Note that if stylesheet bug happen the document.styleSheets.length is still 0.
    for (var i = 0; i < styleSheetsCount; i++) {
	document.styleSheets[i].disabled = false;
    }
    // bugSS: Now is document.styleSheets.length = number of stylesheets again.

    var customStyles = {};
    $(this.svg).find('*').each(function(idx) {

        var computedStyle = window.getComputedStyle(this, null);
        var defaultComputedStyle = defaultComputedStyles[idx];
        var customStyle = {};

        _.each(computedStyle, function(property) {

            // Store only those that differ from the default styles applied by the browser.
                // TODO: Problem will arise with browser specific properties (browser prefixed ones).
            if (computedStyle.getPropertyValue(property) !== defaultComputedStyle[property]) {

                customStyle[property] = computedStyle.getPropertyValue(property);
            }
        });
        
        customStyles[idx] = customStyle;
    });

    var images = [];

    // 3.
    $(svgClone).find('*').each(function(idx) {

        $(this).css(customStyles[idx]);

	if (this.tagName.toLowerCase() === 'image') {
	    
	    images.push(this);
	}
    });

    function serialize() {

	// Now, when our `svgClone` is ready, serialize it to a string and return it.
        return (new XMLSerializer()).serializeToString(svgClone);
    }

    if (opt.convertImagesToDataUris && images.length) {

	function convertImages(done) {
	    
	    var image = V(images.shift());
	    if (!image) return done();

            // Firefox uses `href`, all the others 'xlink:href'
            var url = image.attr('xlink:href') || image.attr('href');

	    joint.util.imageToDataUri(url, function(err, dataUri) {
		
		image.attr('xlink:href', dataUri);
		convertImages(done);
	    });
	}

	convertImages(function() { 

	    callback(serialize()); 
	});

    } else {

	return callback(serialize());
    }
};


// Just a little helper for quick-opening the paper as data-uri SVG in a new browser window.
joint.dia.Paper.prototype.openAsSVG = function(opt) {

    var windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
    var windowName = _.uniqueId('svg_output');

    this.toSVG(function(svg) {

	var imageWindow = window.open('', windowName, windowFeatures);
	var dataImageUri = 'data:image/svg+xml,' + encodeURIComponent(svg);
	imageWindow.document.write('<img src="' + dataImageUri + '" style="max-height:100%" />');

    }, _.extend({ convertImagesToDataUris: true }, opt));
};

