/*jslint node:true */
/*
 * freedom.js Node runtime
 */

'use strict';
var resolvers = [],
  providers = [
    require('freedom/providers/core/core.unprivileged'),
    require('freedom/providers/core/echo.unprivileged'),
    require('freedom/providers/core/logger.console'),
    require('freedom/providers/core/peerconnection.unprivileged'),
    require('./providers/core.storage'),
    require('./providers/core.tcpsocket'),
    require('./providers/core.udpsocket')
  ],
  oauth = require('freedom/providers/core/oauth'),
  websocket = require('freedom/providers/core/websocket.unprivileged');

websocket.setSocket(require('ws'), true);

providers.push(oauth);
providers.push(websocket);

if (!module.parent) {
  require('./lib/modulecontext');
} else {
  global.Promise = require('es6-promise').Promise;
  require('./lib/resolvers')(resolvers);

  module.exports.freedom = require('freedom/src/entry').bind({}, {
    location: "node://" + module.parent.filename,
    portType: require('./lib/link'),
    providers: providers,
    resolvers: resolvers,
    isModule: false
  });
}
