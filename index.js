/*jslint node:true */
/*
 * freedom.js Node runtime
 */

'use strict';
var resolvers = [],
  providers = [
    require('freedom/providers/core/core.unprivileged'),
    require('freedom/providers/core/core.echo'),
    require('freedom/providers/core/core.console'),
    require('freedom/providers/core/core.peerconnection'),
    require('./providers/core.storage'),
    require('./providers/core.tcpsocket'),
    require('./providers/core.udpsocket'),
    require('freedom/providers/core/core.view'),
    require('freedom/providers/core/core.oauth')
  ],
  websocket = require('freedom/providers/core/core.websocket');

websocket.setSocket(require('ws'), true);
providers.push(websocket);

if (!module.parent) {
  require('./lib/modulecontext');
} else {
  require('./lib/resolvers')(resolvers);

  module.exports.freedom = require('freedom/src/entry').bind({}, {
    location: "node://" + module.parent.filename,
    portType: require('./lib/link'),
    providers: providers,
    resolvers: resolvers,
    isModule: false
  });
}
