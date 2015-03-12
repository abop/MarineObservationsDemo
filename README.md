Rappid
======

The HTML 5 diagramming toolkit.

List of modules
---------------

See http://jointjs.com/rappid/docs for the complete list of modules and documentation.

Directory structure
-------------------

dist/   ... Contains distribution files of JointJS core library and all the plugins.
plugins/  ... Contains the source code and other related files to all the plugins.
src/   ... Contains source files of the JointJS core library.
KitchenSink/ ... An example application.
Rappid/ ... A more elaborate application.
BPMNEditor/ ... A BPMN editor example application.

Documentation
-------------

Online documentation to all the plugins is located at the http://jointjs.com/rappid/docs.

Quick start
-----------

Probably the best way to start is by opening the KitchenSink/index.html in your browser and studying
the KitchenSink/main.js file. The KitchenSink application serves as a reference for using the plugins
and how they can be combined. A more elaborate and useful application is in the Rappid/ directory.
Just open Rappid/index.html file in your browser. This application is more advanced than the KitchenSink
application and use many time used as a foundation for further development.


Notes
-----

Some plugins (e.g. Halo and Stencil) contain Handlebars templates (http://handlebarsjs.com) that,
when their adjustments are desired, need to be compiled. All such plugins contain a build file - Gruntfile.js (http://gruntjs.com).
This grunt build file makes it easy to create the distribution JavaScript/CSS files needed when using those plugins.
In order to build the distribution files, one needs to have NodeJS (http://nodejs.org) and grunt-cli (https://github.com/gruntjs/grunt-cli)
installed. After that, run once `npm install` in the plugin directory (where the package.json file is located) in order to install all the dependencies.
Making the build is then a matter of running `grunt` on the command line in the plugin directory (where the Gruntfile.js is located).


Support
-------

Please use our JointJS_plus repository on Github to file bugs and feature requests:
https://github.com/clientIO/JointJS_plus/issues. We cannot guarantee a response time but we'll
do our best to fix bugs as soon as we can. A commercial support is available as well
(see the http://jointjs.com/support page). If you have any questions, drop us an email
at support@client.io.


License
-------

Rappid is licensed under the Rappid License. Please see the LICENSE file for the full license.

Copyright (c) 2015 client IO
