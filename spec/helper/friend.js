var friend = freedom();

friend.on('message', function(msg) {
  // Test that we can get random bytes in module scope
  var randomness = getRandomValues(new Uint16Array(10));
  var passed = (randomness.length === 10);
  for (var i = 0; i < randomness.length; i++) {
    passed = passed && passed >= 0 && passed <= 65535;
  }
  if (passed) {
    friend.emit('message', 'got message: ' + msg);
  };
});
