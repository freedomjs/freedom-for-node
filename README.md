freedom-runtime-node
====================

A Node runtime for freedomjs apps.

Installation
------------

    npm install --save freedom-runtime-node


Running
-------

Creating a freedomjs application from node is slightly different from within
a browser.  We follow the node conventions of using require to separate
namespaces, and spawn child processes to allow dropping of privileges of
potentially untrusted code.

    var app = require('freedom-runtime-node').freedom('path/to/module.json');
	app.on('event', function(data) {
		// Do things.
	});
	app.emit('message', 'my Message');

