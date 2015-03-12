var CommonInspectorInputs = {

    size: {
        width: { type: 'number', min: 1, max: 500, group: 'geometry', index: 1 },
        height: { type: 'number', min: 1, max: 500, group: 'geometry', index: 2 }
    },
    position: {
        x: { type: 'number', min: 1, max: 2000, group: 'geometry', index: 3 },
        y: { type: 'number', min: 1, max: 2000, group: 'geometry', index: 4 }
    },
    name: { type: 'text', group: 'data', index: 1 }
};

var CommonInspectorGroups = {

    text: { label: 'Text', index: 1 },
    presentation: { label: 'Presentation', index: 2 },
    geometry: { label: 'Geometry', index: 3, closed: true },
    data: { label: 'Data', index: 4 }
};

var CommonInspectorTextInputs = {
    'text': { type: 'textarea', group: 'text', index: 1 },
    'font-size': { type: 'range', min: 5, max: 80, unit: 'px', group: 'text', index: 2, when: { regex: { 'attrs/text/text': 'a.c' } } },
    'font-family': { type: 'select', options: ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Garamond', 'Tahoma', 'Lucida Console', 'Comic Sans MS'], group: 'text', index: 3 },
    'fill': { type: 'color', group: 'text', index: 4 },
    style: {
        'text-decoration': { type: 'select', options: ['none', 'underline', 'overline', 'line-through'], group: 'text' }
    }
};

var InspectorDefs = {

    'link': {

        inputs: {

            attrs: {
                '.connection': {
                    'stroke-width': { type: 'range', min: 0, max: 50, defaultValue: 1, unit: 'px', group: 'connection', index: 1 },
                    'stroke': { type: 'color', group: 'connection', index: 2 }
                },
                '.marker-source': {
                    transform: { type: 'range', min: 0, max: 15, unit: 'x scale', defaultValue: 'scale(1)', valueRegExp: '(scale\\()(.*)(\\))', group: 'marker-source', index: 1 },
                    fill: { type: 'color', group: 'marker-source', index: 2 }
                },
                '.marker-target': {
                    transform: { type: 'range', min: 0, max: 15, unit: 'x scale', defaultValue: 'scale(1)', valueRegExp: '(scale\\()(.*)(\\))', group: 'marker-target', index: 1 },
                    fill: { type: 'color', group: 'marker-target', index: 2 }
                }
            },
            smooth: { type: 'toggle', group: 'connection', index: 3 },
            manhattan: { type: 'toggle', group: 'connection', index: 4 },

            labels: {
                type: 'list',
                group: 'labels',
                item: {
                    type: 'object',
                    properties: {
                        position: { type: 'range', min: 0.1, max: .9, step: .1, defaultValue: .5, label: 'position', index: 2 },
                        attrs: {
                            text: {
                                text: {
                                    type: 'text', label: 'text', defaultValue: 'label', index: 1
                                }
                            }
                        }
                    }
                }
            }
        },
        groups: {
            labels: { label: 'Labels', index: 1 },
            'connection': { label: 'Connection', index: 2 },
            'marker-source': { label: 'Source marker', index: 3 },
            'marker-target': { label: 'Target marker', index: 4 }
        }
    },

    'basic.Rect': {

        inputs: _.extend({

            attrs: {
                text: CommonInspectorTextInputs,
                rect: {
                    fill: { type: 'color', group: 'presentation', index: 1 },
                    'stroke-width': { type: 'range', min: 0, max: 30, defaultValue: 1, unit: 'px', group: 'presentation', index: 2 }
                }
            },

            myobject: {
                type: 'object',
                group: 'data',
                properties: {
                    first: { type: 'number' },
                    second: { type: 'text' }
                }
            },
            mylist: {
                // This is an example of using the `when` clause.
                // The mylist will be displayed only if cell.get('myobject').second === 'secret'.
                when: {
                    eq: {
                        'myobject/second': 'secret'
                    },
                    otherwise: {
                        unset: true
                    }
                },
                type: 'list',
                group: 'data',
                item: {
                    type: 'text'
                }
            },
            // This is an example of using the `when` clause.
            // The mycondition will be displayed only if cell.attr('text/text') matches the a.c regular expression.
            mycondition: {
                type: 'text',
                when: {
                    regex: {
                        'attrs/text/text': 'a.c'
                    }
                },
                group: 'data'
            },
            nestedList: {
                type: 'list',
                group: 'data',
                item: {
                    type: 'list',
                    item: { type: 'text' }
                }
            },
            nestedObject: {
                type: 'object',
                group: 'data',
                properties: {
                    nested: {
                        type: 'object',
                        properties: {
                            one: { type: 'text' },
                            two: { type: 'text' }
                        }
                    },
                    shallow: { type: 'text' }
                }
            }
            
        }, CommonInspectorInputs),

        groups: CommonInspectorGroups
    },
    
    'basic.Circle': {

        inputs: _.extend({

            attrs: {
                text: CommonInspectorTextInputs,
                circle: {
                    fill: { type: 'color', group: 'presentation', index: 1 },
                    'stroke-width': { type: 'range', min: 0, max: 30, defaultValue: 1, unit: 'px', group: 'presentation', index: 2 }
                }
            }
        }, CommonInspectorInputs),

        groups: CommonInspectorGroups
    },

    'devs.Atomic': {
        
        inputs: {
            inPorts: { type: 'list', item: { type: 'text' }, group: 'data', index: -2 },
            outPorts: { type: 'list', item: { type: 'text' }, group: 'data', index: -1 }
        }
    }
};
