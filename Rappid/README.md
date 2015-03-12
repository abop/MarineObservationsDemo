Rappid demo application
========================

This application showcases the Rappid plugins in action and shows how the plugins
can be combined together. You can take this demo app as a reference for your own application
development.

Rnning the app
--------------

Just open index.html in your browser.


Running the app with real-time collaboration enabled
-----------------------------------------------------

For getting the real-time collaboration feature up and running, a couple of additional steps
must be performed. The Channel plugin relies on a NodeJS server running in order to
synchronize graphs between clients. Thanks to NodeJS and its package manager (npm), it is quite easy:

1. Install NodeJS (http://nodejs.org/). This installation already contains npm (Node Pacakge Manager).
2. Go to the root directory of the Rappid package (where the package.json file is located) and run:

npm install

This installs all the necessary packages.

3. Go to the Rappid/src directory and run:

node channelHub

This runs the server-side channel and a hub for managing rooms of connected clients.
If you're curious, you can run:

node channelHub --repl

which brings up a console that you can use to interact with the JointJS graph on the server side!
Type: help <RET> to see examples of what you can do.

4. Edit the Rappid/index.html file and follow the instructions at the bottom of it. It's just
commenting/uncommenting two lines of code in order to enable the channel plugin on the client side.

5. Open Rappid/index.html file in your browser. You should see a link in the statusbar. If you open
that link in another browser window and edit the diagram in one of the windows, you should see
all the changes are reflected in the other window (and also on the server!).
