// Channel - Graph synchronization plugin.
// =======================================

// The synchronization protocol is inspired by the paper
// High-Latency, Low-Bandwidth Windowing in the Jupiter Collaboration System; 1995, Nichols, Curtis.

// Basic usage
// -----------

// Server: (`port` is passed)
// var channel = new joint.com.Channel({ graph: graph, port: 1234 });

// Client: (`url` is passed)
// var channel = new joint.com.Channel({ graph: graph, url: 'ws://localhost:1234' });

// ChannelHub (a.k.a. rooms).
// --------------------------

// Client:
// var channel1 = new joint.com.Channel({ graph: graph1, url: 'ws://localhost:1234', query: { room: 'A' } });
// Another client:
// var channel2 = new joint.com.Channel({ graph: graph2, url: 'ws://localhost:1234', query: { room: 'A' } });
// Yet another client:
// var channel3 = new joint.com.Channel({ graph: graph3, url: 'ws://localhost:1234', query: { room: 'B' } });

// Server (one channel/graph per room):
// var channels = {};
// var channelHub = new joint.com.ChannelHub({ port: 4141 });
// channelHub.route(function(req) {
//    var query = JSON.parse(req.query.query);
//    if (channels[query.room]) return channels[query.room];
//    Neither `port` nor `url` is passed: do not create a server, the ChannelHub takes care of this.
//    return channels[req.query.room] = new joint.com.Channel({ graph: new joint.dia.Graph });
//});

// Notifications (non-reliable but faster communication).
// ------------------------------------------------------

// channelClient1.on('telepointer', function(data) {  renderPointer(data.x, data.y, data.color) });
// channelClient2.notify('telepointer', { x: 50, y: 50, color: 'red' });

    
if (typeof exports === 'object') {

    var joint = {
        com: {},
        util: require('../../../src/core').util
    };
    var WebSocketServer = require('ws').Server;
    var WebSocket = require('ws');
    var _ = require('lodash');
    var url = require('url');
    var Backbone = require('backbone');
}

joint.com = joint.com || {};

// Channel
// =======

joint.com.Channel = function(opt) {
    
    this.options = opt;

    if (!this.options || !this.options.graph) throw new Error('Channel: missing a graph.');

    // Time-to-live of a site. If `ttl` for a site reaches zero, such site is considered dead
    // and the channel removes it from its register (`this.sites` and `this.state`).
    this.options.ttl = this.options.ttl || 60;

    // Interval in ms in which a health check is performed on all the sites. Each health
    // check decreases the `ttl` for a site if the site socket is considered disconnected.
    // If the site socket is connected, the `ttl` is returned to its original value.
    // The default is a health check performed every 1 minute with defualt ttl 60 meaning
    // that if a socket of a site was found disconnected every minute of an hour, then such site
    // is considered stale and therefore removed from the channel register.
    this.options.healthCheckInterval = this.options.healthCheckInterval || (1000 * 60 * 60);

    // If a connection got closed, try to reconnect every `options.reconnectInterval` milliseconds.
    // The default is 10s.
    this.options.reconnectInterval = this.options.reconnectInterval || 10000;

    // Set to `false` if you don't want newly connected clients to receive the whole graph from the server.
    // Default is `true`. Setting this to `false` is useful if it is the client who has the newest
    // graph, not the server. For example, if we have an application that loads a graph via AJAX on the
    // client side and we then want other clients to connect, we don't want those clients
    // to recieve an empty graph from the ChannelHub.
    this.options.serverShouldSendGraph = _.isUndefined(this.options.serverShouldSendGraph) ? true : this.options.serverShouldSendGraph;
    
    // Servers do not have a `url` options but rather a `port` they listen on.
    this._isClient = !!this.options.url;
    
    // A list of sockets for all the clients connected to this channel.
    this._clients = [];

    // A list of operations waiting to be sent. This queue gets populated
    // when the channel gets paused.
    this.messageQueue = [];
    
    // This site ID.
    this.id = this.options.id || (this._isClient ? 'c_' : 's_') + joint.util.uuid();
    
    // State vector. Number of operations generated and processed for each connected channel including
    // the channel itself. This state vector is sent witch each operation.
    this.state = {};
    this.state[this.id] = 0;
    
    // Connected channels and the channel itself. Includes the `outgoing` queue and the current site socket.
    // This is also useful for recognizing if a site got re-connected or if it is a completely new site.
    this.sites = {};
    this.sites[this.id] = { socket: undefined, outgoing: [], ttl: this.options.ttl };

    this.initialize();
};

_.extend(joint.com.Channel.prototype, Backbone.Events);

// Establish a connection between client and server and listen on graph changes.
joint.com.Channel.prototype.initialize = function() {

    this.options.graph.on('all', this.onGraphChange.bind(this));

    if (this._isClient) {

        this.connectClient();
        
    } else if (this.options.port) {
        
        this.server = new WebSocketServer({ port: this.options.port });
        this.server.on('connection', this.onConnection.bind(this));
    }

    if (!this._isClient) {
        
        this._healthCheckInterval = setInterval(this.healthCheck.bind(this), this.options.healthCheckInterval);
    }
};

// Connect client to the server defined in the `options.url`.
joint.com.Channel.prototype.connectClient = function() {

    var url = this.options.url + '/?channelId=' + this.id + '&state=' + JSON.stringify(this.state) + (this.options.query ? '&query=' + JSON.stringify(this.options.query) : '' );

    if (this.options.debugLevel > 0) this.log('connectClient', url);
    
    // Send current `state` together with this `channelId` to the server.
    var socket = new WebSocket(url);
    socket.onopen = this.onConnection.bind(this, socket);
    socket.onclose = this.onClose.bind(this, socket);
};

// Close all sockets. This effectively shuts down the channel.
joint.com.Channel.prototype.close = function() {

    if (this._reconnectTimeout) clearTimeout(this._reconnectTimeout);
    if (this._healthCheckInterval) clearInterval(this._healthCheckInterval);
    
    // Mark the channel as closed. This will prevent future reconnection (see `onClose()`).
    // Note that the `onClose()` is called after we close the client socket in the following lines.
    this._closed = true;
    
    _.each(this.sites, function(site) {

        if (site.socket) site.socket.close();
    });

    if (this.server) this.server.close();
};

// Checks wheater a site is alive (it's socket is connected). If it is not alive, decreate
// the site `ttl`. If the `ttl` of a site reaches zero, remove the site and its state from the register.
joint.com.Channel.prototype.healthCheck = function() {

    if (this.options.debugLevel > 0) this.log('healthCheck', _.object(_.keys(this.sites), _.pluck(this.sites, 'ttl')));
    
    _.each(this.sites, function(site, channelId) {

        // Do not health check the channel itself.
        if (channelId === this.id) return;
        
        // readyState === 1 => OPEN socket.
        if (!site.socket || site.socket.readyState !== 1) {
            site.ttl -= 1;
        } else {
            site.ttl = this.options.ttl;
        }

        if (site.ttl <= 0) {

            delete this.sites[channelId];
            delete this.state[channelId];
        }
        
    }, this);
};

// Handle a client connection to the server.
joint.com.Channel.prototype.onConnection = function(socket) {

    // Store the socket to the internal list of clients. This is useful for cleaning up sockets
    // from clients that have re-connected.
    this._clients.push(socket);

    if (this._isClient) {
        
        this.sites[this.id].socket = socket;
        socket.onmessage = function(evt) { this.onMessage(socket, evt.data); }.bind(this);

    } else {

        // The required query fields from clients are `channelId` and `state` object JSON stringified.
        var upgradeReqUrl = url.parse(socket.upgradeReq.url, true);
        var channelId = upgradeReqUrl.query.channelId;
        
        if (this.sites[channelId]) {
            // Re-connected site.
            // @TODO: send the site ops from the message queue that the client has not yet seen.
            this.sites[channelId].socket = socket;
            
        } else {

            if (this.debugLevel > 1) this.log('new_site', channelId);
            
            // New site.
            this.sites[channelId] = { socket: socket, outgoing: [], ttl: this.options.ttl };
            this.state[channelId] = 0;

            if (this.options.serverShouldSendGraph) {

                // Send the new site the whole graph.
                var op = {
                    channelId: this.id,
                    state: JSON.parse(JSON.stringify(this.state)),
                    action: 'graph',
                    graph: this.options.graph.toJSON()
                };
                
                this.messageQueue.push({ type: 'op', data: op, source: this.id, target: [channelId] });
                this.send();
            }
        }
        
        socket.on('message', this.onMessage.bind(this, socket));
        socket.on('close', this.onClose.bind(this, socket));
    }
};

// Handle a client disconnection.
joint.com.Channel.prototype.onClose = function(socket) {

    var index = this._clients.indexOf(socket);
    if (index !== -1) {
        this._clients.splice(index, 1);
    }

    // If the connection got closed, try to reconnect every 10s or every `options.reconnectInterval` milliseconds.
    if (this._isClient && !this._closed) {

        if (this._reconnectTimeout) clearTimeout(this._reconnectTimeout);
        
        this._reconnectTimeout = setTimeout(this.connectClient.bind(this), this.options.reconnectInterval);
    }

    this.trigger('close', socket);
};

// Remote update.
joint.com.Channel.prototype.onMessage = function(socket, message) {

    this.trigger('message:received', message);
    
    if (this.options.debugLevel > 1) this.log('message', message);

    try {
        message = JSON.parse(message);
    } catch (err) {
        // This should never happen.
        return console.error('Channel: message parsing failed.', err);
    }

    if (message.type == 'notification') {
        // Notification. If a notification is received, the event it carries is triggered on the channel.
        // If a server receives a notification, it broadcasts it to all the clients except the one
        // that sent the notification.

        this.trigger(message.data.event, message.data.data);
        return this.sendNotification(message);
    }

    var op = message.data;

    // Receive the op at every site.
    // Note that in case of a client, there is only one site.
    // In case of the server, there is the server's site itself and sites for all the clients.

    if (this._isClient) {

        // Transform the operation in the client's state. Note that clients do not store
        // the state of the server (or even other clients) but only their own state.
        var mySite = this.sites[this.id];
        op = this.receive(mySite, this.id, op);
        
    } else {

        // Send and transform the operation in the state of the sending client.
        var otherSite = this.sites[op.channelId];
        op = this.receive(otherSite, op.channelId, op);

        // Now send the transformed operation to my own state.
        var mySite = this.sites[this.id];
        op = this.receive(mySite, this.id, op);
    }

    // Update the version tuple. Note that if the operation action was the whole graph, then we
    // need to update the state of the server (that the client keeps track of) to the state
    // that was sent with the graph operation as there might have been much more than one operation
    // applied on the server before the graph was sent.
    if (op.action === 'graph') {
        
        this.state[op.channelId] = op.state[op.channelId];
        
    } else {
        
        this.state[op.channelId] = (this.state[op.channelId] || 0) + 1;
    }

    if (this.options.debugLevel > 1) this.log('new state', this.state);

    // Execute the operation. Note that we have to execute after we have update the state as
    // executing one operation can lead to generating other operations (see e.g. `disconnectLinks` in `joint.dia.graph`).
    this.execute(op);    

    // Update the `outgoing` queue in all the sites except my own and the one the operation
    // came from as these two cases we handled already (see above). The reason we do this here
    // is that we don't want the operation to be transformed again.
    _.each(this.sites, function(site, channelId) {

        if (channelId !== this.id && channelId !== op.channelId) {
            
            this.receive(site, channelId, op);
        }
    }, this);

    if (!this._isClient) {

        // Broadcast the transformed operation to all the other sites.
        message.op = op;
        this.messageQueue.push(message);
        this.broadcast(message);
    }

    this.trigger('message:processed', message);
};

// Receive an `op` at `site` with id `channelId`. Transform the `op` and Update the outgoing queue
// accordingly. Return the transformed `op`.
joint.com.Channel.prototype.receive = function(site, channelId, op) {

    if (!site) return op;

    if (this.options.debugLevel > 1) this.log('receive', channelId, op);
    if (this.options.debugLevel > 1) this.log('outgoing', site.outgoing);
    
    // Discard acknowledged.
    site.outgoing = _.filter(site.outgoing, function(oldOp) {

        return oldOp.state[oldOp.channelId] >= (op.state[oldOp.channelId] || 0);
    });

    if (this.options.debugLevel > 1) this.log('outgoing.length', site.outgoing.length);

    // Transform and store intermediate results to `outgoing` for next transformations.
    for (var i = 0; i < site.outgoing.length; i++) {
        var oldOp = site.outgoing[i];
        var transformResult = this.transform(op, oldOp);
        op = transformResult[0];
        site.outgoing[i] = transformResult[1];
    }

    return op;
};

// Transform operations `o1` and `o2`. Operation `o1` is the incoming operation. `o2` is taken from the outgoing queue.
// The first item of the returned array is the operation that will be applied, the second is an operation
// that will replace `o2` in outgoing (and will be used in future transformations).
joint.com.Channel.prototype.transform = function(o1, o2) {

    if (this.options.debugLevel > 1) this.log('transform', o1, o2);

    // Note that the other way round is not neccessary to cover as if the incoming op is remove
    // and the the previous operation was change:target to the removed element, then the remove
    // automatically disconnects the link (see `disconnectLinks: true` in `execute()`).
    if (o1.action === 'change:target' && o2.action === 'remove') {

        if (o1.cell.target.id === o2.cell.id) {

            o1.cell.target = { x: 0, y: 0 };
        }
    }

    if (o1.action === 'change:source' && o2.action === 'remove') {

        if (o1.cell.source.id === o2.cell.id) {

            o1.cell.source = { x: 0, y: 0 };
        }
    }

    return [o1, o2];
};

joint.com.Channel.prototype.execute = function(op) {

    var cell;

    switch (op.action) {

      case 'add':
        this.options.graph.addCell(op.cell, { remote: true });
        break;

      case 'remove':
        cell = this.options.graph.getCell(op.cell.id);
        // Do not remove associated links (`disconnectLinks: true`) as these removals arrive as separate operations.
        if (cell) cell.remove({ remote: true, disconnectLinks: true });
        break;

      case 'graph':
        // Complete graph replacement.
        this.options.graph.fromJSON(op.graph);
        break;

    default:
        var attribute = op.action.substr('change:'.length);
        cell = this.options.graph.getCell(op.cell.id);
        if (cell) cell.set(attribute, op.cell[attribute], { remote: true });
        break;
    }
};

// Broadcast `message` to all the sites except the one that send the message (source site).
joint.com.Channel.prototype.broadcast = function(message) {

    if (this._isClient) {
        message.target = _.keys(this.sites);
    } else {
        message.target = _.keys(_.omit(this.sites, this.id, message.source));
    }

    this.send();
};

// Send all operations from the `messageQueue` to their intended recipients.
joint.com.Channel.prototype.send = function() {

    if (this._paused) return;

    // Go through the messages one by one and check if they can be sent. If yes, send the message
    // and remove it from the `messageQueue`. If not, keep the message in the `messageQueue` and break up
    // from the function.

    // Indexes of messages from `messageQueue`.
    var toRemove = [];
    
    for (var i = 0; i < this.messageQueue.length; i++) {
        var m = this.messageQueue[i];
        if (this.sendMessage(m)) {
            // Mark a message that was successfully sent for removal.
            toRemove.push(i);
        }
    }

    // Remove all the successfully sent messages.
    toRemove.forEach(_.bind(function(msgIdx) {
        this.messageQueue.splice(msgIdx, 1);
    }, this));
};

// Send one message to its targets.
joint.com.Channel.prototype.sendMessage = function(m) {

    if (this.debugLevel > 1) this.log('sendMessage', m);

    var successTargets = [];
    
    m.target.forEach(function(target, idx) {

        var recievingSite = this.sites[target];
        // @assert recievingSite.socket

        // Check if the message can be safely send to such a target. If yes, mark
        // the target for removal so that next time we don't send the message to this target again.
        // If the recieving site does not exist anymore, consider the message was successfully sent.
        if (!recievingSite) return successTargets.push(idx);
        if (!recievingSite.socket) return;
        // readyState constants: See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants.
        // 1 === OPEN (The connection is open and ready to communicate.)
        if (recievingSite.socket.readyState !== 1) return;
        

        if (this.debugLevel > 1) this.log('sendMessage', target, m);

        recievingSite.socket.send(JSON.stringify(m));
        successTargets.push(idx);
        
    }, this);

    // Remove all the targets to which the message was successfully sent.
    successTargets.forEach(function(targetIdx) {
        m.target.splice(targetIdx, 1);
    });

    // Return `true` if the message was successfully sent to all the targets.
    if (!m.target.length) return true;
    return false;
};

joint.com.Channel.prototype.log = function(keyword, args) {

    var text = 'Channel [' + this.id + '] ' + keyword.toUpperCase() + ': ';
    
    console.log.apply(console, [text].concat(_.rest(_.toArray(arguments))));
};

// Pause the channel. All messages that are supposed to be sent from now one will end up in the
// `messageQueue` until the channel is unpaused.
joint.com.Channel.prototype.pause = function() {
    
    this._paused = true;
};

// Unpause the channel causing all the messages from `messageQueue` to be send immediately.
joint.com.Channel.prototype.unpause = function() {

    this._paused = false;
    this.send();
};

// Notify everyone about the `event` carrying `data`.
joint.com.Channel.prototype.notify = function(event, data) {

    var message = {
        type: 'notification',
        source: this.id,
        data: { event: event, data: data }
    };
    this.sendNotification(message);
};

// Send notification is like broadcast with send combined except that the message does not go
// to the `messageQueue`. Notifications are not like ops, OT is not involved. They are useful though for
// things like telepointers and other messages which don't require such a safety as ops.
joint.com.Channel.prototype.sendNotification = function(message) {

    if (this._isClient) {
        message.target = _.keys(this.sites);
    } else {
        message.target = _.keys(_.omit(this.sites, this.id, message.source));
    }

    this.sendMessage(message);
};

// Local update.
// Broadcast the operation, store it to the `outgoing` queue and increment this site state.
joint.com.Channel.prototype.onGraphChange = function(eventName, cell, graph, options) {

    // If this change is a result of executing an operation sent by others, do not broadcast.
    if (options && options.remote) return;

    // We're only interested in `add`, `remove` and `change:` events.
    var isInteresting = eventName === 'add' || eventName === 'remove' || eventName.substr(0, 'change:'.length) === 'change:';
    if (!isInteresting) return;

    // Generate operation.
    var op = {
        channelId: this.id,
        state: JSON.parse(JSON.stringify(this.state)),
        action: eventName,
        cell: cell.toJSON()
    };

    // Broadcast message with the operation.
    var message = { type: 'op', data: op, source: this.id };

    if (this.options.debugLevel > 1) this.log('generate', message);
    
    this.messageQueue.push(message);
    this.broadcast(message);

    // Store the `op` for later transformations.
    this.sites[this.id].outgoing.push(op);

    // Move down the state space.
    this.state[this.id]++;
};

// ChannelHub
// ==========

joint.com.ChannelHub = function(opt) {

    this.options = opt;

    if (!this.options.port) throw new Error('ChannelHub: missing a port.');

    this.initialize();
};

_.extend(joint.com.ChannelHub.prototype, Backbone.Events);

joint.com.ChannelHub.prototype.initialize = function() {
    
    this.server = new WebSocketServer({ port: this.options.port });
    this.server.on('connection', this.onConnection.bind(this));
};

joint.com.ChannelHub.prototype.onConnection = function(socket) {

    // The required query fields from clients are `channelId` and `state` object JSON stringified.
    var upgradeReqUrl = url.parse(socket.upgradeReq.url, true);
    var req = { query: upgradeReqUrl.query };

    if (!this.router) throw new Error('ChannelHub: missing a router.');
    
    var channel = this.router(req);
    channel.onConnection(socket);
};

joint.com.ChannelHub.prototype.route = function(router) {
    this.router = router;
};

// Shut down the server.
joint.com.ChannelHub.prototype.close = function() {

    this.server.close();
};


if (typeof exports === 'object') {

    module.exports.Channel = joint.com.Channel;
    module.exports.ChannelHub = joint.com.ChannelHub;
}
