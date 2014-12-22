freedom-for-node
====================

[![Code Climate](https://codeclimate.com/github/freedomjs/freedom-for-node/badges/gpa.svg)](https://codeclimate.com/github/freedomjs/freedom-for-node)
[![Build Status](https://travis-ci.org/freedomjs/freedom-for-node.svg?branch=master)](https://travis-ci.org/freedomjs/freedom-for-node)
A freedom.js Distribution for inclusion by Node.js.

Installation
------------

    npm install --save freedom-for-node


Running
-------

Creating a freedom.js application from node is identical to the case in the browser.
You can find the `freedom` object exported from the module.
    
    require('freedom-for-node').freedom('path/to/module.json', {}).then(function(Root){
	var root = new Root();
	root.on('event', function(data) {
		// Do things.
	});
	root.emit('message', 'my Message');
    });

