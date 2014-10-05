var testUtil = require('freedom/spec/util');
testUtil.setSpecBase('node://' + require('path').dirname(require.resolve('freedom')),
                    require('../lib/resolvers'));
var providers = [
  require('freedom/providers/core/core.unprivileged'),
  require('freedom/providers/core/logger.console'),
//  require('../../providers/core/peerconnection.unprivileged'),
  require('../providers/storage')
];
var websocket = require('freedom/providers/core/websocket.unprivileged');
websocket.setSocket(require('ws'), true);
providers.push(websocket);

testUtil.setCoreProviders(providers);
testUtil.setModuleStrategy(require('../providers/link'));

describe("integration-single: social.loopback.json",
    require('freedom/spec/providers/social/social.single.integration.src').bind(this,
    "/providers/social/loopback/social.loopback.json"));
describe("integration-single: social.ws.json",
    require('freedom/spec/providers/social/social.single.integration.src').bind(this,
    "/providers/social/websocket-server/social.ws.json"));
describe("integration-double: social.ws.json",
    require('freedom/spec/providers/social/social.double.integration.src').bind(this,
    "/providers/social/websocket-server/social.ws.json"));

describe("integration: storage.isolated.json",
    require('freedom/spec/providers/storage/storage.integration.src').bind(this,
    "/providers/storage/isolated/storage.isolated.json"));
describe("integration: storage.shared.json",
    require('freedom/spec/providers/storage/storage.integration.src').bind(this,
    "/providers/storage/shared/storage.shared.json", false));
