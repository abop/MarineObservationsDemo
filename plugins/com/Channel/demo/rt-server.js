var joint = require('../../../../index');
var Channel = require('../joint.com.Channel').Channel;
var ChannelHub = require('../joint.com.Channel').ChannelHub;

var PORT = 4141;

var channels = {};
var channelHub = new ChannelHub({ port: PORT });
channelHub.route(function(req) {
    var query = JSON.parse(req.query.query);
    if (channels[query.room]) return channels[query.room];
    return channels[query.room] = new Channel({ graph: new joint.dia.Graph });
});

console.log('ChannelHub running on port ' + PORT);
console.log('Starting repl... Type "help" to see examples on what you can do. To exit the repl, press Ctrl-C twice or type ".exit".');

var repl = require('repl');
var cli = repl.start({ prompt: 'Channel > ' });
cli.context.joint = joint;
cli.context.channels = channels;
cli.context.help = [
    'Type channels [enter] to see the server side channels for each room.',
    'channels.A.options.graph.addCell(new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 70 } }))',
    'channels.B.options.graph.get("cells").at(0).translate(300, 100, { transition: { duration: 2000 } })'
];

cli.on('exit', function () {
    console.log('Bye.');
    process.exit();
});
