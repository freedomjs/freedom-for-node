freedom-for-node
====================

[![Build Status](https://travis-ci.org/freedomjs/freedom-for-node.svg?branch=master)](https://travis-ci.org/freedomjs/freedom-for-node)
A freedom.js Distribution for inclusion by Node.js.

Installation
------------

    npm install --save freedom-for-node


Running
-------

Creating a freedom.js application from node is slightly different from within
a browser.  We follow the node conventions of using require to separate
namespaces, and spawn child processes to allow dropping of privileges of
potentially untrusted code.

    var app = require('freedom-for-node').freedom('path/to/module.json');
	app.on('event', function(data) {
		// Do things.
	});
	app.emit('message', 'my Message');

