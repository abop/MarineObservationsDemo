// joint.storage.Local stores graphs to the HTML 5 localStorage.
// The API is inspired by the great MongoDB database.

// Example usage:
//     var graph = new joint.dia.Graph;
//     (new joint.shapes.basic.Rect).addTo(graph);
//     joint.storage.Local.insert('graphs', graph);
//     joint.storage.Local.find('graphs', {}, function(err, graphs) {});
//     joint.storage.Local.remove('graphs', {}, function(err) {});

joint.storage = joint.storage || {};

joint.storage.Local = {

    prefix: 'joint.storage',

    // Store a document `doc` to the `collection` in localStorage.
    // `callback` has the following signature: `callback(err, doc)` where
    // `doc` is the inserted document.
    insert: function(collection, doc, callback) {

        var id = doc.id || _.uniqueId('doc-');

        var index = this.loadIndex(collection);
        index.keys.push(id);

        this.setItem(this.docKey(collection, id), doc);
        this.setItem(this.indexKey(collection), index);

        // Don't add the `id` to the document if it wasn't there.
        this.callback(callback, null, _.extend({}, doc, { id: id }));
    },

    // Find a document in `collection`.
    // `query` can currently be either empty in which case all the
    // documents from the `collection` are returned or it can contain `id`
    // of a document in which case only a document with that `id` is returned.
    // `callback` signature is: `callback(err, docs)`.
    find: function(collection, query, callback) {

        var index = this.loadIndex(collection);
        var docs = [];
        
        if (_.isEmpty(query)) {

            // Find all documents in the collection.
            _.each(index.keys, function(id) {
                
                var doc = this.getItem(this.docKey(collection, id));
                if (!doc) {

                    this.callback(callback, new Error('Storage incosistency. No document found for an ID ' + id + ' from index.'));
                }

                docs.push(doc);

            }, this);

            this.callback(callback, null, docs);

        } else if (query.id) {

            var doc = this.getItem(this.docKey(collection, query.id));
            this.callback(callback, null, doc ? [doc] : []);

        } else {

            // Other queries supported yet.
            this.callback(callback, null, []);
        }
    },

    // Remove a document from the `collection`. `query` can currently be either empty
    // in which case all the documents from the `collection` are removed
    // or it can contain an `id` of the document to be removed.
    // `callback` signature is: `callback(err)`.
    remove: function(collection, query, callback) {

        var index = this.loadIndex(collection);

        if (_.isEmpty(query)) {

            _.each(index.keys, function(id) {

                localStorage.removeItem(this.docKey(collection, id));

            }, this);

            localStorage.removeItem(this.indexKey(collection));
            this.callback(callback, null);

        } else if (query.id) {

            _.remove(index.keys, function(key) { return key === query.id; });
            localStorage.removeItem(this.docKey(collection, query.id));
            this.setItem(this.indexKey(collection), index);
            this.callback(callback, null);
        }
    },

    // Private helpers.
    // ----------------

    callback: function(callback, err, ret) {

        if (callback) {

            _.defer(function() {

                callback(err, ret);
            });
        }
    },

    setItem: function(key, item) {

        localStorage.setItem(key, JSON.stringify(item));
    },

    getItem: function(key) {

        var item = localStorage.getItem(key);
        return item ? JSON.parse(item) : item;
    },

    loadIndex: function(collection) {

        var index = this.getItem(this.indexKey(collection)) || {};
        index.keys = index.keys || [];
        return index;
    },

    docKey: function(collection, id) {

        return this.prefix + '.' + collection + '.docs.' + id;
    },

    indexKey: function(collection) {

        return this.prefix + '.' + collection + '.index';
    }
};
