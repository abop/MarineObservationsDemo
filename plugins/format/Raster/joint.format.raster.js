// requires: joint.format.svg.js plugin
// support 3rd party library: canvg - canvg.js, rgbcolor.js, StackBlur.js

joint.dia.Paper.prototype.toDataURL = function(callback, options) {

    // check whether the svg export plugin was loaded.
    if (typeof this.toSVG !== 'function') throw new Error('The joint.format.svg.js plugin must be loaded.');

    // options: type, width, height, quality (works only with type set to 'image/jpeg' or 'image/webp'),
    // backgroundColor
    options = options || {};

    var imageWidth, imageHeight, contentHeight, contentWidth, padding = options.padding || 0;

    if (!options.width || !options.height) {

	// The raster size wasn't defined. We get the size of the bounding client rect of the viewport instead.
	var clientRect = this.viewport.getBoundingClientRect();

	// the dimensions of the image content (without padding)
	contentWidth = clientRect.width || 1;
	contentHeight = clientRect.height || 1;

	// the dimensions of the output image
	imageWidth = contentWidth + 2*padding;
	imageHeight = contentHeight + 2*padding;

    } else {

	imageWidth = options.width;
	imageHeight = options.height;

	// The padding value has to be smaller than half a width and half a height.
	padding = Math.min(padding, imageWidth/2 - 1, imageHeight/2 - 1);

	contentWidth = imageWidth - 2*padding;
	contentHeight = imageHeight - 2*padding;
    }

    var img = new Image();
    var svg;

    // Drawing an image into the canvas has to be done after the image was completely loaded.
    img.onload = function() {

	var dataURL, context, canvas;

	// Helper to create a new canvas.
	function createCanvas() {

	    canvas = document.createElement('canvas');
	    canvas.width = imageWidth;
	    canvas.height = imageHeight;

	    // Draw rectangle of a certain color covering the whole canvas area.
	    // A JPEG image has black background by default and it might not be desirable.
	    context = canvas.getContext('2d');
	    context.fillStyle = options.backgroundColor || 'white';
	    context.fillRect(0, 0, imageWidth, imageHeight);
	};

	createCanvas();

	// Drawing SVG images can taint our canvas in some browsers. That means we won't be able
	// to read canvas back as it would fail with `Error: SecurityError: DOM Exception 18`.
	// See `http://getcontext.net/read/chrome-securityerror-dom-exception-18`.
	try {

	    // Draw the image to the canvas with native `drawImage` method.
	    context.drawImage(img, padding, padding, contentWidth, contentHeight);

	    // Try to read the content of our canvas.
	    dataURL = canvas.toDataURL(options.type, options.quality);

	    // Return dataURL in the given callback.
	    callback(dataURL);

	} catch (e) {

	    // The security error was thrown. We have to parse and render the SVG image with
	    // `canvg` library (https://code.google.com/p/canvg/).

	    if (typeof canvg === 'undefined') {

		// The library is not present.
		return console.error('Canvas tainted. Canvg library required.');
	    }

	    // The canvas was tainted. We need to render a new one. Clearing only the content won't help.
	    createCanvas();

	    // Draw the SVG with canvg library.


	    function replaceSVGImagesWithSVGEmbedded(svg) {

		return svg.replace(/\<image[^>]*>/g, function(imageTag) {
		    
		    var href = imageTag.match(/href="([^"]*)"/)[1];
		    var svgDataUriPrefix = 'data:image/svg+xml';
		    if (href.substr(0, svgDataUriPrefix.length) === svgDataUriPrefix) {

			var svg = decodeURIComponent(href.substr(href.indexOf(',') + 1));
			// Strip the <?xml ...?> header if there is one.
			return svg.substr(svg.indexOf('<svg'));
		    }
		    return imageTag;
		});
	    }
	    
	    var canvgOpt = {
		ignoreDimensions: true,
		ignoreClear: true,
		offsetX: padding,
		offsetY: padding,
		useCORS: true
	    };

	    canvg(canvas, svg, _.extend({}, canvgOpt, {

		renderCallback: function() {

		    try {
			// Read content of our canvas once again.
			dataURL = canvas.toDataURL(options.type, options.quality);
			// Return dataURL in the given callback.
			callback(dataURL);

		    } catch (e) {

			// As IE throws security error when trying to 
			// draw an SVG into the canvas that contains (even though data-uri'ed)
			// <image> element with another SVG in it, we apply a little trick here.
			// The trick is in replacing all <image> elements that have
			// SVG in xlink:href with embedded <svg> elements.

			svg = replaceSVGImagesWithSVGEmbedded(svg);

			// And try again. If even this fails, there is no hope.
			
			createCanvas();
			canvg(canvas, svg, _.extend({}, canvgOpt, {
			    
			    renderCallback: function() {

				dataURL = canvas.toDataURL(options.type, options.quality);
				callback(dataURL);
			    }
			}));
		    }
		}
	    }));

	    return;
	}
    };

    this.toSVG(function(svgString) {

	// A canvas doesn't like width and height to be defined as percentage for some reason. We need to replace it
	// with desired width and height instead.
	svg = svgString = svgString.replace('width="100%"','width="' + contentWidth + '"').replace('height="100%"','height="' + contentHeight + '"');

	// An image starts loading when we assign its source.
	//img.src = 'data:image/svg+xml;base64,' + btoa(encodeURIComponent(svgString));
	//img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
	img.src = 'data:image/svg+xml,' + encodeURIComponent(svgString);

    }, { convertImagesToDataUris: true });
};

joint.dia.Paper.prototype.toPNG = function(callback, options) {

    // options: width, height, backgroundColor
    options = options || {};
    options.type = 'image/png';
    this.toDataURL(callback, options);
};

joint.dia.Paper.prototype.toJPEG = function(callback, options) {

    // options: width, height, backgroundColor, quality
    options = options || {};
    options.type = 'image/jpeg';
    this.toDataURL(callback, options);
};

// Just a little helper for quick-opening the paper as PNG in a new browser window.
joint.dia.Paper.prototype.openAsPNG = function(opt) {

    var windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
    var windowName = _.uniqueId('png_output');

    this.toPNG(function(dataURL) {

	var imageWindow = window.open('', windowName, windowFeatures);
	imageWindow.document.write('<img src="' + dataURL + '"/>');

    }, _.extend({ padding: 10 }, opt));
};
