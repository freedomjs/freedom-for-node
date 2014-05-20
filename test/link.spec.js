describe('link.Node', function() {
  it('Runs freedom Modules as node processes', function(done) {
    var freedom = require('../index').freedom;

    var module = freedom('helper/friend.json');
    module.on('message', function(msg) {
      expect(msg).toEqual('got message: roundtrip');
      done();
    });
    module.emit('message', 'roundtrip');
  });
});