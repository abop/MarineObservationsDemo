// Inspector plugin.
// -----------------

// This plugin creates a two-way data-binding between the cell model and a generated
// HTML form with input fields of a type declaratively specified in an options object passed
// into the element inspector.

/*
USAGE:

var inspector = new joint.ui.Inspector({
    cellView: cellView,
    inputs: {
            attrs: {
                text: {
                    'font-size': { type: 'number', min: 5, max: 80, group: 'text', index: 2 },
                    'text': { type: 'textarea', group: 'text', index: 1 }
                }
            },
            position: {
                x: { type: 'number', group: 'geometry', index: 1 },
                y: { type: 'number', group: 'geometry', index: 2 }
            },
            size: {
                width: { type: 'number', min: 1, max: 500, group: 'geometry', index: 3 },
                height: { type: 'number', min: 1, max: 500, group: 'geometry', index: 4 }
            },
            mydata: {
                foo: { type: 'textarea', group: 'data' }
            }
   },
   groups: {
           text: { label: 'Text', index: 1 },
           geometry: { label: 'Geometry', index: 2, closed: true },
           data: { label: 'data', index: 3 }
   }
});

$('.inspector-container').append(inspector.render().el);
*/

joint.ui.Inspector = Backbone.View.extend({

    className: 'inspector',

    options: {
        cellView: undefined,    // One can pass either a cell view ...
        cell: undefined,        // ... or the cell itself.
        live: true,      // By default, we enabled live changes from the inspector inputs.
        validateInput: function(input, path) { return input.validity.valid; }
    },

    events: {
        'mousedown': 'startBatchCommand',
        'change [data-attribute]': 'onChangeInput',
        'click .group-label': 'onGroupLabelClick',
        'click .btn-list-add': 'addListItem',
        'click .btn-list-del': 'deleteListItem'
    },

    initialize: function(options) {

	this.options = _.extend({}, _.result(this, 'options'), options || {});
        this.options.groups = this.options.groups || {};

        _.bindAll(this, 'stopBatchCommand');

        // Start a batch command on `mousedown` over the inspector and stop it when the mouse is
        // released anywhere in the document. This prevents setting attributes in tiny steps
        // when e.g. a value is being adjusted through a slider. This gives other parts
        // of the application a chance to treat the serveral little changes as one change.
        // Consider e.g. the CommandManager plugin.
        $(document).on('mouseup', this.stopBatchCommand);
        
        
        // Flatten the `inputs` object until the level where the options object is.
        // This produces an object with this structure: { <path>: <options> }, e.g. { 'attrs/rect/fill': { type: 'color' } }
        this.flatAttributes = joint.util.flattenObject(this.options.inputs, '/', function(obj) {
            // Stop flattening when we reach an object that contains the `type` property. We assume
            // that this is our options object. @TODO This is not very robust as there could
            // possibly be another object with a property `type`. Instead, we should stop
            // just before the nested leaf object.
            return obj.type;
        });

        // `_when` object maps path to a set of conditions (either `eq` or `regex`).
        // When an input under the path changes to
        // the value that equals all the `eq` values or matches all the `regex` regular expressions,
        // the inspector rerenders itself and this time includes all the
        // inputs that met the conditions.
        this._when = {};

        // `_bound` object maps a slave path to a master path (A slave is using master's data).
        // When an input under the master path changes, the inspector rerenders the input under the
        // slave path
        this._bound = {};

        // Add the attributes path the options object as we're converting the flat object to an array
        // and so we would loose the keys otherwise.
        var attributesArray = _.map(this.flatAttributes, function(options, path) {

            if (options.when) {

                var dependant = { expression: options.when, path: path };

                _.each(this.extractExpressionPaths(dependant.expression), function(condPath) {
                    (this._when[condPath] || (this._when[condPath] = [])).push(dependant);
                }, this);
            }

            // If the option type is 'select' and its options needs resolving (is defined by path)
            // we bind the select (slave) and the input under the path (master) together.
            if (options.type == 'select' && _.isString(options.options)) {
                // slave : master
                this._bound[path] = options.options;
            }

            options.path = path;
            return options;

        }, this);

        // Sort the flat attributes object by two criteria: group first, then index inside that group.
        // As underscore 'sortBy' is a stable sort algorithm we can sort by index first and then
        // by group again.
        this.groupedFlatAttributes = _.sortBy(_.sortBy(attributesArray, 'index'), function(options) {
            var groupOptions = this.options.groups[options.group];
            return (groupOptions && groupOptions.index) || Number.MAX_VALUE;
        }, this);

        // Cache all the attributes (inputs, lists and objects) with every change to the DOM tree.
        // Chache it by its path.
        this.on('render', function() {

            this._byPath = {};
            
            _.each(this.$('[data-attribute]'), function(attribute) {
                var $attribute = $(attribute);
                this._byPath[$attribute.attr('data-attribute')] = $attribute;
            }, this);
            
        }, this);

        // Listen on events on the cell.
        this.listenTo(this.getModel(), 'all', this.onCellChange, this);
    },

    getModel: function() {
        return this.options.cell || this.options.cellView.model;
    },

    onCellChange: function(eventName, cell, change, opt) {

        opt = opt || {};

        // Do not react on changes that happened inside this inspector. This would
        // cause a re-render of the same inspector triggered by an input change in this inspector.
        if (opt.inspector == this.cid) return;

        // Note that special care is taken for all the transformation attribute changes
        // (`position`, `size` and `angle`). See below for details.
        
        switch (eventName) {
            
          case 'remove':
            // Make sure the element inspector gets removed when the cell is removed from the graph.
            // Otherwise, a zombie cell could possibly be updated.
            this.remove();
            break;
          case 'change:position':
            // Make a special case for `position` as this one is performance critical.
            // There is no need to rerender the whole inspector but only update the position input.
            this.updateInputPosition();
            break;
          case 'change:size':
            // Make a special case also for the `size` attribute for the same reasons as for `position`.
            this.updateInputSize();
            break;
          case 'change:angle':
            // Make a special case also for the `angle` attribute for the same reasons as for `position`.
            this.updateInputAngle();
            break;
          case 'change:source':
          case 'change:target':
          case 'change:vertices':
            // Make a special case also for the 'source' and 'target' of a link for the same reasons
            // as for 'position'. We don't expect source or target to be configurable.
            // That's why we do nothing here.
            break;
        default:
            // Re-render only on specific attributes changes. These are all events that starts with `'change:'`.
            // Otherwise, the re-render would be called unnecessarily (consider generic `'change'` event, `'bach:start'`, ...).
            var changeAttributeEvent = 'change:';
            if (eventName.slice(0, changeAttributeEvent.length) === changeAttributeEvent) {
                
                this.render();
            }
            break;
        }
    },

    render: function() {

        this.$el.empty();

        var lastGroup;
        var $groups = [];
        var $group;
        
        _.each(this.groupedFlatAttributes, function(options) {

            if (lastGroup !== options.group) {
                // A new group should be created.

                var groupOptions = this.options.groups[options.group];
                var groupLabel = groupOptions ? groupOptions.label || options.group : options.group;
                
                $group = $(joint.templates.inspector['group.html']({ label: groupLabel }));
                $group.attr('data-name', options.group);
                if (groupOptions && groupOptions.closed) $group.addClass('closed');
                $groups.push($group);
            }
            
            this.renderTemplate($group, options, options.path);

            lastGroup = options.group;
            
        }, this);

        this.$el.append($groups);

        this.trigger('render');
        
        return this;
    },

    // Get the value of the attribute at `path` based on the `options.defaultValue`,
    // and `options.valueRegExp` if present.
    getCellAttributeValue: function(path, options) {

        var cell = this.getModel();

        var value = joint.util.getByPath(cell.attributes, path, '/');
        if (!options) return value;

        if (_.isUndefined(value) && !_.isUndefined(options.defaultValue)) {
            value = options.defaultValue;
        }

        if (options.valueRegExp) {

            if (_.isUndefined(value)) {
                
                throw new Error('Inspector: defaultValue must be present when valueRegExp is used.');
            }
            
            var valueMatch = value.match(new RegExp(options.valueRegExp));
            value = valueMatch && valueMatch[2];
        }

        return value;
    },

    resolveBindings: function(options) {

        switch(options.type) {

          case 'select': // options['options'] are transformed here to options['items']

            var items = options.options || [];

            // resolve items if the options are defined indirectly as a reference to a model property
            if (_.isString(items)) {

                items = joint.util.getByPath(this.getModel().attributes, items, '/') || [];
            }

            // Check if items array has incorrect format (i.e an array of strings).
            if (!_.isObject(items[0])) {
                // Transform each array item into the { value: [value], content: [content] } object.
                items = _.map(items, function(item) { return { value: item, content: item }; });
            }

            // export result as 'items'
            options.items = items;

            break;
        }
    },

    updateBindings: function(path) {

        // Find all inputs which are bound to the current input (i.e find all slaves).
        var slaves = _.reduce(this._bound, function(result, master, slave) {

            // Does the current input path starts with a master path?
            if (!path.indexOf(master)) result.push(slave);

            return result;

        }, []);

        if (!_.isEmpty(slaves)) {

            // Re-render all slave inputs
            _.each(slaves, function(slave) {
                this.renderTemplate(null, this.flatAttributes[slave], slave, { replace: true });
            }, this);

            this.trigger('render');
        }
    },

    renderTemplate: function($el, options, path, opt) {

        $el = $el || this.$el;
        opt = opt || {};

        this.resolveBindings(options);

        // Wrap the input into a `.field` classed element so that we can easilly hide and show
        // the entire block.
        var $field = $('<div class="field"></div>').attr('data-field', path);

        if (options.when && !this.isExpressionValid(options.when)) {
            $field.addClass('hidden');
            if (options.when.otherwise) {
                if (options.when.otherwise.unset) this.unsetProperty(path);
            }
        }

        var value = this.getCellAttributeValue(path, options);

        var inputHtml = joint.templates.inspector[options.type + '.html']({
            options: options,
            type: options.type,
            label: options.label || path,
            attribute: path,
            value: value
        });

        var $input = $(inputHtml);
        $field.append($input);

        // `options.attrs` allows for setting arbitrary attributes on the generated HTML.
        // This object is of the form: `<selector> : { <attributeName> : <attributeValue>, ... }`
        _.each(options.attrs, function(attrs, selector) {
            $field.find(selector).addBack().filter(selector).attr(attrs);
        });

        if (options.type === 'list') {
            
            _.each(value, function(itemValue, idx) {

                var $listItem = $(joint.templates.inspector['list-item.html']({
                    index: idx
                }));

                this.renderTemplate($listItem, options.item, path + '/' + idx);

                $input.children('.list-items').append($listItem);
                
            }, this);
            
        } else if (options.type === 'object') {

            options.flatAttributes = joint.util.flattenObject(options.properties, '/', function(obj) {
                // Stop flattening when we reach an object that contains the `type` property. We assume
                // that this is our options object. @TODO This is not very robust as there could
                // possibly be another object with a property `type`. Instead, we should stop
                // just before the nested leaf object.
                return obj.type;
            });

            var attributesArray = _.map(options.flatAttributes, function(options, path) {
                options.path = path;
                return options;
            });
            // Sort the attributes by `index` and assign the `path` to the `options` object
            // so that we can acess it later.
            attributesArray = _.sortBy(attributesArray, function(options) {

                return options.index;
            });

            _.each(attributesArray, function(propertyOptions) {

                var $objectProperty = $(joint.templates.inspector['object-property.html']({
                    property: propertyOptions.path
                }));

                this.renderTemplate($objectProperty, propertyOptions, path + '/' + propertyOptions.path);

                $input.children('.object-properties').append($objectProperty);
                
            }, this);
        }

        if (opt.replace) {

            $el.find('[data-field="' + path + '"]').replaceWith($field);

        } else {

            $el.append($field);
        }
    },

    updateInputPosition: function() {

        var $inputX = this._byPath['position/x'];
        var $inputY = this._byPath['position/y'];

        var position = this.getModel().get('position');
        
        if ($inputX) { $inputX.val(position.x); }
        if ($inputY) { $inputY.val(position.y); }
    },
    updateInputSize: function() {

        var $inputWidth = this._byPath['size/width'];
        var $inputHeight = this._byPath['size/height'];

        var size = this.getModel().get('size');
        
        if ($inputWidth) { $inputWidth.val(size.width); }
        if ($inputHeight) { $inputHeight.val(size.height); }
    },
    updateInputAngle: function() {

        var $inputAngle = this._byPath['angle'];

        var angle = this.getModel().get('angle');
        
        if ($inputAngle) { $inputAngle.val(angle); }
    },

    onChangeInput: function(evt) {

        var $input = $(evt.target);
        var path = $input.attr('data-attribute');

        if (!this.options.validateInput($input[0], path)) return;

        if (this.options.live) {
            
            this.updateCell($input, path);
        }

        var type = $input.attr('data-type');
        var value = this.parse(type, $input.val(), $input[0]);
        var dependants = this._when[path];

        // Notify the outside world that an input has changed.
        this.trigger('change:' + path, value, $input[0]);

        if (dependants) {

            // Go through all the inputs that are dependent on the value of the changed input.
            // Show them if the 'when' expression is evaluated to 'true'. Hide them otherwise.
            _.each(dependants, function(dependant) {

                var $attribute = this._byPath[dependant.path];
                var $field = $attribute.closest('.field');
                var previouslyHidden = $field.hasClass('hidden');

                var valid = this.isExpressionValid(dependant.expression);

                $field.toggleClass('hidden', !valid);

                if (dependant.expression.otherwise) {
                    // unset option - works only with 'live' inspector.
                    if (dependant.expression.otherwise.unset && this.options.live) {

                        if (!valid) {

                            // When an attribute is hidden in the inspector unset its value in the model.
                            this.unsetProperty(dependant.path);
                            this.renderTemplate(null, this.flatAttributes[dependant.path], dependant.path, { replace: true });
                            this.trigger('render');

                        } else if (previouslyHidden) {

                            // The attribute just switched from hidden to visible. We set its value
                            // to the cell again in case it was unset earlier.
                            this.updateCell($attribute, dependant.path);
                        }
                    }
                }

            }, this);
        }
    },

    // unset a model property
    unsetProperty: function(path, opt) {

        var cell = this.getModel();
        var pathArray = path.split('/');
        var attribute = _.first(pathArray);
        var nestedAttrPath = _.rest(pathArray).join('/');

        opt = opt || {};
        opt.inspector = this.cid;
        opt['inspector_' + this.cid] = true; // kept for backwards compatibility

        if (path == 'attrs') {
            // Unsetting an attrs property requires to re-render the view. The cell.removeAttr() does
            // it for us.
            cell.removeAttr(nestedAttrPath, opt);
        } else if (path == attribute) {
            // Unsetting a primitive object. Fast path.
            cell.unset(attribute, opt);
        } else {
            // Unsetting a nested property.
            var oldAttrValue = _.merge({}, cell.get(attribute));
            var newAttrValue = joint.util.unsetByPath(oldAttrValue, nestedAttrPath, '/');
            cell.set(attribute, newAttrValue, opt);
        }
    },

    getOptions: function($attribute) {

        if ($attribute.length === 0) return undefined;
        
        var path = $attribute.attr('data-attribute');
        var type = $attribute.attr('data-type');
        var options = this.flatAttributes[path];
        if (!options) {
            var $parentAttribute = $attribute.parent().closest('[data-attribute]');
            var parentPath = $parentAttribute.attr('data-attribute');
            options = this.getOptions($parentAttribute);
            var childPath = path.replace(parentPath + '/', '');
            var parent = options;
            options = parent.item || parent.flatAttributes[childPath];
            options.parent = parent;
        }
        return options;
    },

    updateCell: function($attr, attrPath) {

        var cell = this.getModel();

        var byPath = {};

        if ($attr) {
            // We are updating only one specific attribute
            byPath[attrPath] = $attr;
        } else {
            // No parameters given. We are updating all attributes
            byPath = this._byPath;
        }

        this.startBatchCommand();
        this._tempListsByPath = {};

        _.each(byPath, function($attribute, path) {

            if ($attribute.closest('.field').hasClass('hidden')) return;

            var type = $attribute.attr('data-type');
            var value;
            var options;
            var kind;

            switch (type) {
                
              case 'list':

                // TODO: this is wrong! There could have been other properties not
                // defined in the inspector which we delete by this! We should only remove
                // those items that disappeared from DOM.

		// Do not empty the list (and trigger change event) if we have at
		// least one item in the list. It is not only desirable but necessary.
		// An example is when an element has ports. If we emptied the list
		// and then reconstructed it again, all the links connected to the ports
		// will get lost as the element with ports will think the ports disappeared
		// first.
                if (!byPath[path + '/0']) {
                    this.setProperty(path, [], { rewrite: true });
                } else {
                    this._tempListsByPath[path] = [];
                }

                break;
                
              case 'object':
                // For objects, all is handled in the actual inputs.
                break;
                
            default:

                if (!this.options.validateInput($attribute[0], path)) return;

                value = this.parse(type, $attribute.val(), $attribute[0]);
                options = this.getOptions($attribute);

                if (options.valueRegExp) {
                    var oldValue = joint.util.getByPath(cell.attributes, path, '/') || options.defaultValue;
                    value = oldValue.replace(new RegExp(options.valueRegExp), '$1' + value + '$3');
                }

		if (options.parent && options.parent.type === 'list') {

		    var pathArray = path.split('/');
                    var parentPath =_.initial(pathArray).join('/');

                    // if the temporary list doesn't exist we are changing the input value only
                    if (this._tempListsByPath[parentPath]) {

		        var index = parseInt(_.last(pathArray), 10);
		        this._tempListsByPath[parentPath][index] = value;

		        // Check if there is another item coming, if not, trigger change event,
		        // otherwise do not do that as that is not necessary and not desirable either.
		        if (!byPath[parentPath + '/' + (index + 1)]) {
                            this.setProperty(parentPath, this._tempListsByPath[parentPath], { rewrite: true });
                        }

                        return;
                    }
		}

                this.setProperty(path, value);
                break;
            }

            this.updateBindings(path);

        }, this);

        this.stopBatchCommand();
    },

    setProperty: function(path, value, opt) {

        opt = opt || {};
        opt.inspector = this.cid;
        opt['inspector_' + this.cid] = true; // kept for backwards compatibility

        // the model doesn't have to be a JointJS cell necessary. It could be
        // an ordinary Backbone.Model and such would have no method 'prop'.
        joint.dia.Cell.prototype.prop.call(this.getModel(), path, value, opt);
    },

    // Parse the input `value` based on the input `type`.
    // Override this method if you need your own specific parsing.
    parse: function(type, value, targetElement) {
        
        switch (type) {
          case 'number':
            value = parseFloat(value);
            break;
          case 'toggle':
            value = targetElement.checked;
            break;
          default:
            value = value;
            break;
        }
        return value;
    },

    startBatchCommand: function() {

        this.getModel().trigger('batch:start');
    },
    
    stopBatchCommand: function() {

        this.getModel().trigger('batch:stop');
    },

    addListItem: function(evt) {

        var $target = $(evt.target);
        var $attribute = $target.closest('[data-attribute]');
        var path = $attribute.attr('data-attribute');
        var options = this.getOptions($attribute);

        // Take the index of the last list item and increase it by one.
        var $lastListItem = $attribute.children('.list-items').children('.list-item').last();
        var lastIndex = $lastListItem.length === 0 ? -1 : parseInt($lastListItem.attr('data-index'), 10);
        var index = lastIndex + 1;

        var $listItem = $(joint.templates.inspector['list-item.html']({ index: index }));
        
        this.renderTemplate($listItem, options.item, path + '/' + index);

        $target.parent().children('.list-items').append($listItem);
        $listItem.find('input:first').focus();

        this.trigger('render');
        
        if (this.options.live) {
            this.updateCell();
        }
    },
    
    deleteListItem: function(evt) {

        var $listItem = $(evt.target).closest('.list-item');

        // Update indexes of all the following list items and their inputs.
        $listItem.nextAll('.list-item').each(function() {
            
            var index = parseInt($(this).attr('data-index'), 10);
            var newIndex = index - 1;

            // TODO: if field labels are not defined and the paths string are used
            // for labels instead, these are not rewritten.

            // Find all the nested inputs and update their path so that it contains the new index.
            $(this).find('[data-field]').each(function() {
                $(this).attr('data-field', $(this).attr('data-field').replace('/' + index, '/' + newIndex));
            });

            // Find all the nested inputs and update their path so that it contains the new index.
            $(this).find('[data-attribute]').each(function() {
                $(this).attr('data-attribute', $(this).attr('data-attribute').replace('/' + index, '/' + newIndex));
            });

            // Update the index of the list item itself.
            $(this).attr('data-index', newIndex);
        });

        $listItem.remove();
        this.trigger('render');
        
        if (this.options.live) {
            this.updateCell();
        }
    },

    remove: function() {

        $(document).off('mouseup', this.stopBatchCommand);
        return Backbone.View.prototype.remove.apply(this, arguments);
    },

    onGroupLabelClick: function(evt) {

        // Prevent default action for iPad not to handle this event twice.
        evt.preventDefault();
        
        var $group = $(evt.target).closest('.group');
        this.toggleGroup($group.data('name'));
    },
    
    toggleGroup: function(name) {

        this.$('.group[data-name="' + name + '"]').toggleClass('closed');
    },

    closeGroup: function(name) {
        
        this.$('.group[data-name="' + name + '"]').addClass('closed');
    },

    openGroup: function(name) {
        
        this.$('.group[data-name="' + name + '"]').removeClass('closed');
    },

    closeGroups: function() {

        this.$('.group').addClass('closed');
    },

    openGroups: function() {

        this.$('.group').removeClass('closed');
    },

    // Expressions

    _isComposite: function(expr) {
        var composite = _.pick(expr, 'not','and','or','nor');
        return _.some(composite);
    },

    _isPrimitive: function(expr) {
        var primitive = _.pick(expr, 'eq', 'ne', 'regex', 'text', 'lt', 'lte', 'gt', 'gte', 'in', 'nin');
        return _.some(primitive);
    },

    _evalPrimitive: function(expr) {

        return _.reduce(expr, function(res, condition, operator) {
            return _.reduce(condition, function(res, condValue, condPath) {

                var val = this.getCellAttributeValue(condPath, this.flatAttributes[condPath]);

                switch (operator) {
                  case 'eq':
                    return condValue == val;
                  case 'ne':
                    return condValue != val;
                  case 'regex':
                    return (new RegExp(condValue)).test(val);
                  case 'text':
                    return !condValue || (_.isString(val) && val.toLowerCase().indexOf(condValue) > -1);
                  case 'lt':
                    return val < condValue;
                  case 'lte':
                    return val <= condValue;
                  case 'gt':
                    return val > condValue;
                  case 'gte':
                    return val >= condValue;
                  case 'in':
                    return _.contains(condValue, val);
                  case 'nin':
                    return !_.contains(condValue, val);
                default:
                    return res;
                }

            }, false, this);
        }, false, this);
    },

    _evalExpression: function(expr) {

        if (this._isPrimitive(expr)) {
            return this._evalPrimitive(expr);
        }

        return _.reduce(expr, function(res, childExpr, operator) {

            if (operator == 'not') return !this._evalExpression(childExpr);

            var childExprRes = _.map(childExpr, this._evalExpression, this);

            switch (operator) {
              case 'and':
                return _.every(childExprRes);
              case 'or':
                return  _.some(childExprRes);
              case 'nor':
                return !_.some(childExprRes);
            default:
                return res;
            }

        }, false, this);
    },

    _extractVariables: function(expr) {

        if (_.isArray(expr) || this._isComposite(expr)) {
            return _.reduce(expr, function(res, childExpr) {
                return res.concat(this._extractVariables(childExpr));
            }, [], this);
        }

        return _.reduce(expr, function(res, primitive) {
            return _.keys(primitive);
        }, []);
    },

    isExpressionValid: function(expr) {
        expr = _.omit(expr, 'otherwise');
        return this._evalExpression(expr);
    },

    extractExpressionPaths: function(expr) {
        expr = _.omit(expr, 'otherwise');
        return _.uniq(this._extractVariables(expr));
    }
});
