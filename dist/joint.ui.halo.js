/*! Rappid - the diagramming toolkit

Copyright (c) 2013 client IO

 2015-02-04 


This Source Code Form is subject to the terms of the Rappid License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


/*

Copyright (C) 2011 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

// lib/handlebars/browser-prefix.js
var Handlebars = {};

(function(Handlebars, undefined) {
;
// lib/handlebars/base.js

Handlebars.VERSION = "1.0.0";
Handlebars.COMPILER_REVISION = 4;

Handlebars.REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '>= 1.0.0'
};

Handlebars.helpers  = {};
Handlebars.partials = {};

var toString = Object.prototype.toString,
    functionType = '[object Function]',
    objectType = '[object Object]';

Handlebars.registerHelper = function(name, fn, inverse) {
  if (toString.call(name) === objectType) {
    if (inverse || fn) { throw new Handlebars.Exception('Arg not supported with multiple helpers'); }
    Handlebars.Utils.extend(this.helpers, name);
  } else {
    if (inverse) { fn.not = inverse; }
    this.helpers[name] = fn;
  }
};

Handlebars.registerPartial = function(name, str) {
  if (toString.call(name) === objectType) {
    Handlebars.Utils.extend(this.partials,  name);
  } else {
    this.partials[name] = str;
  }
};

Handlebars.registerHelper('helperMissing', function(arg) {
  if(arguments.length === 2) {
    return undefined;
  } else {
    throw new Error("Missing helper: '" + arg + "'");
  }
});

Handlebars.registerHelper('blockHelperMissing', function(context, options) {
  var inverse = options.inverse || function() {}, fn = options.fn;

  var type = toString.call(context);

  if(type === functionType) { context = context.call(this); }

  if(context === true) {
    return fn(this);
  } else if(context === false || context == null) {
    return inverse(this);
  } else if(type === "[object Array]") {
    if(context.length > 0) {
      return Handlebars.helpers.each(context, options);
    } else {
      return inverse(this);
    }
  } else {
    return fn(context);
  }
});

Handlebars.K = function() {};

Handlebars.createFrame = Object.create || function(object) {
  Handlebars.K.prototype = object;
  var obj = new Handlebars.K();
  Handlebars.K.prototype = null;
  return obj;
};

Handlebars.logger = {
  DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, level: 3,

  methodMap: {0: 'debug', 1: 'info', 2: 'warn', 3: 'error'},

  // can be overridden in the host environment
  log: function(level, obj) {
    if (Handlebars.logger.level <= level) {
      var method = Handlebars.logger.methodMap[level];
      if (typeof console !== 'undefined' && console[method]) {
        console[method].call(console, obj);
      }
    }
  }
};

Handlebars.log = function(level, obj) { Handlebars.logger.log(level, obj); };

Handlebars.registerHelper('each', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  var i = 0, ret = "", data;

  var type = toString.call(context);
  if(type === functionType) { context = context.call(this); }

  if (options.data) {
    data = Handlebars.createFrame(options.data);
  }

  if(context && typeof context === 'object') {
    if(context instanceof Array){
      for(var j = context.length; i<j; i++) {
        if (data) { data.index = i; }
        ret = ret + fn(context[i], { data: data });
      }
    } else {
      for(var key in context) {
        if(context.hasOwnProperty(key)) {
          if(data) { data.key = key; }
          ret = ret + fn(context[key], {data: data});
          i++;
        }
      }
    }
  }

  if(i === 0){
    ret = inverse(this);
  }

  return ret;
});

Handlebars.registerHelper('if', function(conditional, options) {
  var type = toString.call(conditional);
  if(type === functionType) { conditional = conditional.call(this); }

  if(!conditional || Handlebars.Utils.isEmpty(conditional)) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

Handlebars.registerHelper('unless', function(conditional, options) {
  return Handlebars.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn});
});

Handlebars.registerHelper('with', function(context, options) {
  var type = toString.call(context);
  if(type === functionType) { context = context.call(this); }

  if (!Handlebars.Utils.isEmpty(context)) return options.fn(context);
});

Handlebars.registerHelper('log', function(context, options) {
  var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
  Handlebars.log(level, context);
});
;
// lib/handlebars/utils.js

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

Handlebars.Exception = function(message) {
  var tmp = Error.prototype.constructor.apply(this, arguments);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }
};
Handlebars.Exception.prototype = new Error();

// Build out our basic SafeString type
Handlebars.SafeString = function(string) {
  this.string = string;
};
Handlebars.SafeString.prototype.toString = function() {
  return this.string.toString();
};

var escape = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};

var badChars = /[&<>"'`]/g;
var possible = /[&<>"'`]/;

var escapeChar = function(chr) {
  return escape[chr] || "&amp;";
};

Handlebars.Utils = {
  extend: function(obj, value) {
    for(var key in value) {
      if(value.hasOwnProperty(key)) {
        obj[key] = value[key];
      }
    }
  },

  escapeExpression: function(string) {
    // don't escape SafeStrings, since they're already safe
    if (string instanceof Handlebars.SafeString) {
      return string.toString();
    } else if (string == null || string === false) {
      return "";
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = string.toString();

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  },

  isEmpty: function(value) {
    if (!value && value !== 0) {
      return true;
    } else if(toString.call(value) === "[object Array]" && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }
};
;
// lib/handlebars/runtime.js

Handlebars.VM = {
  template: function(templateSpec) {
    // Just add water
    var container = {
      escapeExpression: Handlebars.Utils.escapeExpression,
      invokePartial: Handlebars.VM.invokePartial,
      programs: [],
      program: function(i, fn, data) {
        var programWrapper = this.programs[i];
        if(data) {
          programWrapper = Handlebars.VM.program(i, fn, data);
        } else if (!programWrapper) {
          programWrapper = this.programs[i] = Handlebars.VM.program(i, fn);
        }
        return programWrapper;
      },
      merge: function(param, common) {
        var ret = param || common;

        if (param && common) {
          ret = {};
          Handlebars.Utils.extend(ret, common);
          Handlebars.Utils.extend(ret, param);
        }
        return ret;
      },
      programWithDepth: Handlebars.VM.programWithDepth,
      noop: Handlebars.VM.noop,
      compilerInfo: null
    };

    return function(context, options) {
      options = options || {};
      var result = templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);

      var compilerInfo = container.compilerInfo || [],
          compilerRevision = compilerInfo[0] || 1,
          currentRevision = Handlebars.COMPILER_REVISION;

      if (compilerRevision !== currentRevision) {
        if (compilerRevision < currentRevision) {
          var runtimeVersions = Handlebars.REVISION_CHANGES[currentRevision],
              compilerVersions = Handlebars.REVISION_CHANGES[compilerRevision];
          throw "Template was precompiled with an older version of Handlebars than the current runtime. "+
                "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").";
        } else {
          // Use the embedded version info since the runtime doesn't know about this revision yet
          throw "Template was precompiled with a newer version of Handlebars than the current runtime. "+
                "Please update your runtime to a newer version ("+compilerInfo[1]+").";
        }
      }

      return result;
    };
  },

  programWithDepth: function(i, fn, data /*, $depth */) {
    var args = Array.prototype.slice.call(arguments, 3);

    var program = function(context, options) {
      options = options || {};

      return fn.apply(this, [context, options.data || data].concat(args));
    };
    program.program = i;
    program.depth = args.length;
    return program;
  },
  program: function(i, fn, data) {
    var program = function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
    program.program = i;
    program.depth = 0;
    return program;
  },
  noop: function() { return ""; },
  invokePartial: function(partial, name, context, helpers, partials, data) {
    var options = { helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Handlebars.Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    } else if (!Handlebars.compile) {
      throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    } else {
      partials[name] = Handlebars.compile(partial, {data: data !== undefined});
      return partials[name](context, options);
    }
  }
};

Handlebars.template = Handlebars.VM.template;
;
// lib/handlebars/browser-suffix.js
})(Handlebars);
;

this["joint"] = this["joint"] || {};
this["joint"]["templates"] = this["joint"]["templates"] || {};
this["joint"]["templates"]["halo"] = this["joint"]["templates"]["halo"] || {};

this["joint"]["templates"]["halo"]["box.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<label class=\"box\"></label>\n";
  });

this["joint"]["templates"]["halo"]["handle.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "";
  buffer += "style=\"background-image: url("
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + ")\"";
  return buffer;
  }

  buffer += "<div class=\"handle ";
  if (stack1 = helpers.position) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.position; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" draggable=\"false\" data-action=\"";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.icon) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.icon; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.icon) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n    ";
  if (stack1 = helpers.content) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.content; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n\n";
  return buffer;
  });
joint.ui.Halo = Backbone.View.extend({

    className: 'halo',

    events: {
        
        'mousedown .handle': 'onHandlePointerDown',
        'touchstart .handle': 'onHandlePointerDown'
    },

    options: {
	tinyTreshold: 40,
	smallTreshold: 80,
	loopLinkPreferredSide: 'top',
	loopLinkWidth: 40,
	rotateAngleGrid: 15,
        // This option allows you to compute bbox from the model. The view bbox can sometimes return
        // an unwanted result e.g when an element uses SVG filters or clipPaths. Note that downside
        // of computing a bbox is that it takes no relative subelements into account (e.g ports).
        useModelGeometry: false,
        // a function returning a html string, which will be used as the halo box content
        boxContent: function(cellView, boxElement) {

            var tmpl =  _.template('x: <%= x %>, y: <%= y %>, width: <%= width %>, height: <%= height %>, angle: <%= angle %>');

            var bbox = cellView.model.getBBox();

            return tmpl({
                x: Math.floor(bbox.x),
                y: Math.floor(bbox.y),
                width: bbox.width,
                height: bbox.height,
                angle: Math.floor(cellView.model.get('angle') || 0)
            });

        },
        // deprecated (better use joint.dia.Paper.options.linkModel)
	linkAttributes: {},
	smoothLinks: undefined,
        handles: [
            { name: 'resize', position: 'se', events: { pointerdown: 'startResizing', pointermove: 'doResize', pointerup: 'stopBatch' } },
            { name: 'remove', position: 'nw', events: { pointerdown: 'removeElement' } },
            { name: 'clone', position: 'n', events: { pointerdown: 'startCloning', pointermove: 'doClone', pointerup: 'stopCloning' } },
            { name: 'link', position: 'e', events: { pointerdown: 'startLinking', pointermove: 'doLink', pointerup: 'stopLinking' } },
            { name: 'fork', position: 'ne', events: { pointerdown: 'startForking', pointermove: 'doFork', pointerup: 'stopForking' } },
            { name: 'unlink', position: 'w', events: { pointerdown: 'unlinkElement' } },
            { name: 'rotate', position: 'sw', events: { pointerdown: 'startRotating', pointermove: 'doRotate', pointerup: 'stopBatch' } }
        ]
    },

    initialize: function(options) {

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        _.defaults(this.options, {
            paper: this.options.cellView.paper,
            graph: this.options.cellView.paper.model
        });

        _.bindAll(this, 'pointermove', 'pointerup', 'render', 'update', 'remove');

        // Clear a previous halo if there was one for the paper.
        joint.ui.Halo.clear(this.options.paper);

        // Add handles.
        this.handles = [];
        _.each(this.options.handles, this.addHandle, this);

	// Update halo when the graph changed.
        this.listenTo(this.options.graph, 'reset', this.remove);
        this.listenTo(this.options.graph, 'all', this.update);
        // Hide Halo when the user clicks anywhere in the paper or a new halo is created.
        this.listenTo(this.options.paper, 'blank:pointerdown halo:create', this.remove);
        this.listenTo(this.options.paper, 'scale translate', this.update);

        $(document.body).on('mousemove touchmove', this.pointermove);
        $(document).on('mouseup touchend', this.pointerup);

        this.options.paper.$el.append(this.$el);
    },

    render: function() {

        this.options.cellView.model.on('remove', this.remove);

        this.$el.append(joint.templates.halo['box.html']());

	this.renderMagnets();

        this.update();

        this.$el.addClass('animate');
        
        // Add the `data-type` attribute with the `type` of the cell to the root element.
        // This makes it possible to style the halo (including hiding/showing actions) based
        // on the type of the cell.
        this.$el.attr('data-type', this.options.cellView.model.get('type'));

	this.toggleFork();

        return this;
    },

    update: function() {

        if (this.options.cellView.model instanceof joint.dia.Link) return;
        
        if (_.isFunction(this.options.boxContent)) {

            var $box = this.$('.box');
            var content = this.options.boxContent.call(this, this.options.cellView, $box[0]);

            // don't append empty content. (the content might had been created inside boxContent()
            if (content) {
                $box.html(content);
            }
        }

        var bbox = this.options.cellView.getBBox({ useModelGeometry: this.options.useModelGeometry });

	this.$el.toggleClass('tiny', bbox.width < this.options.tinyTreshold && bbox.height < this.options.tinyTreshold);
	this.$el.toggleClass('small', !this.$el.hasClass('tiny') && (bbox.width < this.options.smallTreshold && bbox.height < this.options.smallTreshold));

	this.$el.css({

            width: bbox.width,
            height: bbox.height,
            left: bbox.x,
            top: bbox.y

        }).show();

	this.updateMagnets();

	this.toggleUnlink();
    },

    addHandle: function(opt) {

        this.handles.push(opt);
        
        this.$el.append(joint.templates.halo['handle.html'](opt));

        _.each(opt.events, function(method, event) {

            if (_.isString(method)) {

                this.on('action:' + opt.name + ':' + event, this[method], this);
                
            } else {
                // Otherwise, it must be a function.

                this.on('action:' + opt.name + ':' + event, method);
            }
            
        }, this);
        
        return this;
    },

    removeHandle: function(name) {

        var handleIdx = _.findIndex(this.handles, { name: name });
        var handle = this.handles[handleIdx];
        if (handle) {
            
            _.each(handle.events, function(method, event) {
                
                this.off('action:' + name + ':' + event);
                
            }, this);
            
            this.$('.handle.' + name).remove();

            this.handles.splice(handleIdx, 1);
        }

        return this;
    },

    changeHandle: function(name, opt) {

        var handle = _.findWhere(this.handles, { name: name });
        if (handle) {
            
            this.removeHandle(name);
            this.addHandle(_.merge({ name: name }, handle, opt));
        }
        
        return this;
    },

    onHandlePointerDown: function(evt) {

        this._action = $(evt.target).closest('.handle').attr('data-action');
        if (this._action) {

            evt.preventDefault();
            evt.stopPropagation();
            evt = joint.util.normalizeEvent(evt);

            this._clientX = evt.clientX;
            this._clientY = evt.clientY;
            this._startClientX = this._clientX;
            this._startClientY = this._clientY;

            this.triggerAction(this._action, 'pointerdown', evt);
        }
    },

    // Trigger an action on the Halo object. `evt` is a DOM event, `eventName` is an abstracted
    // JointJS event name (pointerdown, pointermove, pointerup).
    triggerAction: function(action, eventName, evt) {
        
        var args = ['action:' + action + ':' + eventName].concat(_.rest(_.toArray(arguments), 2));
        this.trigger.apply(this, args);
    },

    startCloning: function(evt) {

	this.options.graph.trigger('batch:start');
        
        var clone = this.options.cellView.model.clone();
        clone.unset('z');
        this.options.graph.addCell(clone, { halo: this.cid });

        this._cloneView = clone.findView(this.options.paper);
        this._cloneView.pointerdown(evt, this._clientX, this._clientY);
    },

    startLinking: function(evt) {

	this.options.graph.trigger('batch:start');

        var cellView = this.options.cellView;
        var selector = $.data(evt.target, 'selector');
        var link = this.options.paper.getDefaultLink(cellView, selector && cellView.el.querySelector(selector));

	link.set('source', { id: cellView.model.id, selector: selector });
        link.set('target', { x: evt.clientX, y: evt.clientY });

	link.attr(this.options.linkAttributes);
        if (_.isBoolean(this.options.smoothLinks)) {
            link.set('smooth', this.options.smoothLinks);
        }

	// add link to graph but don't validate
        this.options.graph.addCell(link, { validation: false, halo: this.cid });

        link.set('target', this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY }));

        this._linkView = this.options.paper.findViewByModel(link);
        this._linkView.startArrowheadMove('target');
    },

    startForking: function(evt) {

	this.options.graph.trigger('batch:start');
        
        var clone = this.options.cellView.model.clone();
        clone.unset('z');
        this.options.graph.addCell(clone, { halo: this.cid });

        var link = this.options.paper.getDefaultLink(this.options.cellView);

	link.set('source', { id: this.options.cellView.model.id });
        link.set('target', { id: clone.id });

	link.attr(this.options.linkAttributes);
        if (_.isBoolean(this.options.smoothLinks)) {
            link.set('smooth', this.options.smoothLinks);
        }

        this.options.graph.addCell(link, { halo: this.cid });

        this._cloneView = clone.findView(this.options.paper);
        this._cloneView.pointerdown(evt, this._clientX, this._clientY);
    },

    startResizing: function(evt) {

	this.options.graph.trigger('batch:start');
        
        // determine whether to flip x,y mouse coordinates while resizing or not
        this._flip = [1,0,0,1,1,0,0,1][
            Math.floor(g.normalizeAngle(this.options.cellView.model.get('angle')) / 45)
        ];
    },

    startRotating: function(evt) {

	this.options.graph.trigger('batch:start');
        
        var bbox = this.options.cellView.getBBox();
        
        this._center = g.rect(bbox).center();

	//mousemove event in firefox has undefined offsetX and offsetY
	if (typeof evt.offsetX === 'undefined' || typeof evt.offsetY === 'undefined') {
	    var targetOffset = $(evt.target).offset();
	    evt.offsetX = evt.pageX - targetOffset.left;
	    evt.offsetY = evt.pageY - targetOffset.top;
	}

        this._rotationStart = g.point(evt.offsetX + evt.target.parentNode.offsetLeft, evt.offsetY + evt.target.parentNode.offsetTop + evt.target.parentNode.offsetHeight);

        var angle = this.options.cellView.model.get('angle');

        this._rotationStartAngle = angle || 0;
    },

    doResize: function(evt, dx, dy) {

        var size = this.options.cellView.model.get('size');

        var width = Math.max(size.width + ((this._flip ? dx : dy)), 1);
        var height = Math.max(size.height + ((this._flip ? dy : dx)), 1);

        this.options.cellView.model.resize(width, height, { absolute: true });
    },

    doRotate: function(evt, dx, dy, tx, ty) {

        var p = g.point(this._rotationStart).offset(tx, ty);
        var a = p.distance(this._center);
        var b = this._center.distance(this._rotationStart);
        var c = this._rotationStart.distance(p);
        var sign = (this._center.x - this._rotationStart.x) * (p.y - this._rotationStart.y) - (this._center.y - this._rotationStart.y) * (p.x - this._rotationStart.x);

        var _angle = Math.acos((a*a + b*b - c*c) / (2*a*b));

        // Quadrant correction.
        if (sign <= 0) {
            _angle = -_angle;
        }
        
        var angleDiff = -g.toDeg(_angle);

        angleDiff = g.snapToGrid(angleDiff, this.options.rotateAngleGrid);
        
        this.options.cellView.model.rotate(angleDiff + this._rotationStartAngle, true);
    },

    doClone: function(evt) {

        this._cloneView.pointermove(evt, this._clientX, this._clientY);
    },

    doFork: function(evt) {

        this._cloneView.pointermove(evt, this._clientX, this._clientY);
    },

    doLink: function(evt) {

        var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
        
        this._linkView.pointermove(evt, clientCoords.x, clientCoords.y);
    },

    stopLinking: function(evt) {
        
        this._linkView.pointerup(evt);

        var sourceId = this._linkView.model.get('source').id;
        var targetId = this._linkView.model.get('target').id;

	if (sourceId && targetId && (sourceId === targetId)) {
	    this.makeLoopLink(this._linkView.model);
	}

        this.stopBatch();

        this.triggerAction('link', 'add', this._linkView.model);

	delete this._linkView;
    },
    
    stopForking: function(evt) {

        this._cloneView.pointerup(evt, this._clientX, this._clientY);
        this.stopBatch();
    },

    stopCloning: function(evt) {

        this._cloneView.pointerup(evt, this._clientX, this._clientY);
        this.stopBatch();
    },

    pointermove: function(evt) {

        if (!this._action) return;

        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);

        var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
        var oldClientCoords = this.options.paper.snapToGrid({ x: this._clientX, y: this._clientY });
        
        var dx = clientCoords.x - oldClientCoords.x;
        var dy = clientCoords.y - oldClientCoords.y;

        this.triggerAction(this._action, 'pointermove', evt, dx, dy, evt.clientX - this._startClientX, evt.clientY - this._startClientY);
        
        this._clientX = evt.clientX;
        this._clientY = evt.clientY;
    },

    pointerup: function(evt) {

        if (!this._action) return;

        this.triggerAction(this._action, 'pointerup', evt);

        delete this._action;
    },

    stopBatch: function() {
        
        this.options.graph.trigger('batch:stop');
    },

    remove: function(evt) {

	Backbone.View.prototype.remove.apply(this, arguments);

        $(document.body).off('mousemove touchmove', this.pointermove);
        $(document).off('mouseup touchend', this.pointerup);
    },

    removeElement: function(evt) {

        this.options.cellView.model.remove();
    },

    unlinkElement: function(evt) {

        this.options.graph.removeLinks(this.options.cellView.model);
    },

    toggleUnlink: function() {

	if (this.options.graph.getConnectedLinks(this.options.cellView.model).length > 0) {
	    this.$('.unlink').show()
	} else {
	    this.$('.unlink').hide()
	}
    },

    toggleFork: function() {

        // temporary create a clone model and its view
        var clone = this.options.cellView.model.clone();
        var cloneView = this.options.paper.createViewForModel(clone);

        // if a connection after forking would not be valid, hide the fork icon
        if (!this.options.paper.options.validateConnection(this.options.cellView,null,cloneView,null,'target')) {
	    this.$('.fork').hide();
        }

        cloneView.remove();
        clone = null;
    },

    makeLoopLink: function(link) {

	var linkWidth = this.options.loopLinkWidth;
	var paperOpt = this.options.paper.options;
	var paperRect = g.rect({x: 0, y: 0, width: paperOpt.width, height: paperOpt.height});
	var bbox = V(this.options.cellView.el).bbox(false, this.options.paper.viewport);
	var p1, p2;

	var sides = _.uniq([this.options.loopLinkPreferredSide, 'top', 'bottom', 'left', 'right']);
	var sideFound = _.find(sides, function(side) {

	    var centre, dx = 0, dy = 0;

	    switch (side) {

	    case 'top':
		centre = g.point(bbox.x + bbox.width / 2, bbox.y - linkWidth);
		dx = linkWidth / 2;
		break;

	    case 'bottom':
		centre = g.point(bbox.x + bbox.width / 2, bbox.y + bbox.height + linkWidth);
		dx = linkWidth / 2;
		break;

	    case 'left':
		centre = g.point(bbox.x - linkWidth, bbox.y + bbox.height / 2);
		dy = linkWidth / 2;
		break;

	    case 'right':
		centre = g.point(bbox.x + bbox.width + linkWidth, bbox.y + bbox.height / 2);
		dy = linkWidth / 2;
		break;
	    };

	    p1 = g.point(centre).offset(-dx, -dy);
	    p2 = g.point(centre).offset(dx, dy);

	    return paperRect.containsPoint(p1) && paperRect.containsPoint(p2);
	}, this);

	if (sideFound) link.set('vertices', [p1,p2]);
    },

    // Magnet functions

    renderMagnets: function() {

	this._magnets = [];

	var $link = this.$('.link');
	var magnetElements = this.options.cellView.$('[magnet="true"]');

	if (this.options.magnetFilter) {

	    if (_.isFunction(this.options.magnetFilter)) {

		// We want function to be called with a magnet element as the first parameter. Not an index
		// as jQuery.filter would do it.
		magnetElements = _.filter(magnetElements, this.options.magnetFilter);

	    } else {

		// Every other case runs jQuery.filter method
		magnetElements = magnetElements.filter(this.options.magnetFilter);
	    }
	}

	if ($link.length && magnetElements.length) {

	    var linkWidth = $link.width();
	    var linkHeight = $link.height();

	    _.each(magnetElements, function(magnetElement) {

		var magnetClientRect = magnetElement.getBoundingClientRect();

		var $haloElement = $link.clone()
		    .addClass('halo-magnet')
		    .css({
			width: Math.min(magnetClientRect.width, linkWidth),
			height: Math.min(magnetClientRect.height, linkHeight),
			'background-size': 'contain'
		    })
		    .data('selector', this.options.cellView.getSelector(magnetElement))
		    .appendTo(this.$el);

		this._magnets.push({ $halo: $haloElement, el: magnetElement });

	    }, this);
	}

	// disable linking & forking from the element itself if is it not a magnet
	if (this.options.cellView.$el.attr('magnet') == 'false') {
	    $link.hide();
	    this.$('.fork').hide();
	}
    },

    updateMagnets: function() {

	if (this._magnets.length) {

	    var hClientRect = this.el.getBoundingClientRect();

	    // adjust position of each halo magnet
	    _.each(this._magnets, function(magnet) {

		var mClientRect = magnet.el.getBoundingClientRect();

		magnet.$halo.css({
		    left: mClientRect.left - hClientRect.left + (mClientRect.width - magnet.$halo.width())/2,
		    top: mClientRect.top - hClientRect.top + (mClientRect.height - magnet.$halo.height())/2
		});

	    }, this);
	}
    }

}, {

    // removes a halo from a paper
    clear: function(paper) {

        paper.trigger('halo:create');
    }
});
