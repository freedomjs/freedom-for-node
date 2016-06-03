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
var wrtc = require('wrtc');
var rtcpeer = require('freedom/providers/core/core.rtcpeerconnection');
rtcpeer.setImpl(wrtc);
var peerconnection = require('freedom/providers/core/core.peerconnection');
peerconnection.setImpl(wrtc);

var providers = [
  require('freedom/providers/core/core.unprivileged'),
  require('freedom/providers/core/core.echo'),
  require('freedom/providers/core/core.console'),
  require('freedom/providers/core/core.crypto'),
  require('./providers/core.storage'),
  require('./providers/core.tcpsocket'),
  require('./providers/core.udpsocket'),
  require('freedom/providers/core/core.view'),
  require('freedom/providers/core/core.oauth'),
  websocket,
  xhr,
  rtcpeer,
  peerconnection,
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
