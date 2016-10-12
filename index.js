/* jslint node:true */
/*
 * freedom.js Node runtime
 */

'use strict';
var resolvers = [];
var crypto = require('./lib/fills').crypto;
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
  require('freedom/providers/core/core.rtcdatachannel.js')
];
// Try to load less-certain modules
try {
  // webrtc doesn't build on osx right now
  var rtcpeer = require('freedom/providers/core/core.rtcpeerconnection.js');
  rtcpeer.setImpl(require('wrtc'));
  providers.push(rtcpeer);
} catch(e) {
  console.warn('Failed to load wrtc, will not have WebRTC support');
}
try {
  // xhr is another optional and not always crossplatform dependency
  var xhr = require('freedom/providers/core/core.xhr');
  xhr.setImpl(require('xhr2'));
  providers.push(xhr);
} catch(e) {
  console.warn('Failed to load xhr2, will not have XHR support');
}
try {
  var websocket = require('freedom/providers/core/core.websocket');
  websocket.setSocket(require('ws'), true);
  providers.push(websocket);
} catch(e) {
  console.warn('Failed to load ws, will not have websockets');
}

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
