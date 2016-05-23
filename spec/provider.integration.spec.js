var testUtil = require('freedom/spec/util');
testUtil.setSpecBase('node://' + require('path').dirname(require.resolve('freedom')),
                    require('../lib/resolvers'));
var providers = [
  require('freedom/providers/core/core.unprivileged'),
  require('freedom/providers/core/core.console'),
  require('freedom/providers/core/core.peerconnection'),
  require('../providers/core.storage')
];
var websocket = require('freedom/providers/core/core.websocket');
websocket.setSocket(require('ws'), true);
providers.push(websocket);

var setup = function () {
  "use strict";
  testUtil.setCoreProviders(providers);
  testUtil.setModuleStrategy(require('../lib/link'), undefined, 'error');
};

// Social
describe("integration-single: social.loopback.json", require("freedom/spec/providers/social/social.single.integration.src")
         .bind(this, require("../index").freedom, "../node_modules/freedom/providers/social/loopback/social.loopback.json", {}));
describe("integration-single: social.ws.json", require("freedom/spec/providers/social/social.single.integration.src")
         .bind(this, require("../index").freedom, "../node_modules/freedom/providers/social/websocket-server/social.ws.json", {}));
describe("integration-double: social.ws.json", require("freedom/spec/providers/social/social.double.integration.src")
         .bind(this, require("../index").freedom, "../node_modules/freedom/providers/social/websocket-server/social.ws.json", {}));

// Storage
describe("integration: storage.isolated.json", require("freedom/spec/providers/storage/storage.integration.src")
         .bind(this, require("../index").freedom, "../node_modules/freedom/providers/storage/isolated/storage.isolated.json", {}, false));
describe("integration: storage.shared.json", require("freedom/spec/providers/storage/storage.integration.src")
         .bind(this, require("../index").freedom, "../node_modules/freedom/providers/storage/shared/storage.shared.json", {}, false));

// Transport
xdescribe("integration: transport.webrtc.json",
          require('freedom/spec/providers/transport/transport.integration.src')
          .bind(this,
                "providers/transport/webrtc/transport.webrtc.json", setup));
describe("integration: core.rtcpeerconnection",
         require('freedom/spec/providers/coreIntegration/rtcpeerconnection.integration.src')
         .bind(this,
               require("freedom/providers/core/core.rtcpeerconnection"),
               require("freedom/providers/core/core.rtcdatachannel"),
               setup));
describe("integration: core.tcpsocket",
         require('freedom/spec/providers/coreIntegration/tcpsocket.integration.src').bind(this,
                                                                                          require('../providers/core.tcpsocket'), setup));
var xhr = require('freedom/providers/core/core.xhr');
xhr.setImpl(require('xhr2'));
describe("integration: core.xhr", 
         require("freedom/spec/providers/coreIntegration/xhr.integration.src").bind(this, 
                                                                                    xhr, setup));
