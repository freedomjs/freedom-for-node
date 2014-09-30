describe('link.Node', function() {
  it('Runs freedom Modules as node processes', function(done) {
    var freedom = require('../index').freedom;

    var mod = freedom('helper/friend.json');
    mod.then(function(iface) {
      var channel = iface();
      channel.on('message', function(msg) {
        expect(msg).toEqual('got message: roundtrip');
        done();
      });
      channel.emit('message', 'roundtrip');
    });
  });
});