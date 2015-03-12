Handlebars.registerHelper('is', function(value, test, options) {
    if (value == test) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('is-or-contains', function(value, test, options) {
    if (_.isArray(test) ? _.contains(test, value): value == test) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerPartial('list-item', joint.templates.inspector['list-item.html']);
