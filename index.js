/*jslint node:true */
/*
 * freedom.js Node runtime
 */

'use strict';
var resolvers = [],
  providers = [
    require('freedom/providers/core/core.unprivileged'),
    require('freedom/providers/core/echo.unprivileged'),
    require('freedom/providers/core/console.unprivileged'),
    require('freedom/providers/core/peerconnection.unprivileged'),
    require('./providers/core.storage'),
    require('./providers/core.tcpsocket'),
    require('./providers/core.udpsocket'),
    require('freedom/providers/core/core.view'),
    require('freedom/providers/core/core.oauth')
  ],
  websocket = require('freedom/providers/core/websocket.unprivileged');

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
