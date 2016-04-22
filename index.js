/* jslint node:true */
/*
 * freedom.js Node runtime
 */

'use strict';
var resolvers = [];
var crypto = require('./lib/fills').crypto;
var websocket = require('freedom/providers/core/core.websocket');
var xhr = require('freedom/providers/core/core.xhr');
websocket.setSocket(require('ws'), true);
xhr.setImpl(require('xhr2'));
var rtcpeer = require('freedom/providers/core/core.rtcpeerconnection.js');
rtcpeer.setImpl(require('wrtc'));

var providers = [
  require('freedom/providers/core/core.unprivileged'),
  require('freedom/providers/core/core.echo'),
  require('freedom/providers/core/core.console'),
  require('freedom/providers/core/core.crypto'),
  require('freedom/providers/core/core.peerconnection'),
  require('./providers/core.storage'),
  require('./providers/core.tcpsocket'),
  require('./providers/core.udpsocket'),
  require('freedom/providers/core/core.view'),
  require('freedom/providers/core/core.oauth'),
  websocket,
  xhr,
  rtcpeer,
  require('freedom/providers/core/core.rtcdatachannel.js')
];

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
