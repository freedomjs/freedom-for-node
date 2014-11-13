var friend = freedom();

friend.on('message', function(msg) {
  // Test that we can get random bytes in module scope
  var randomness = new Uint16Array(1000)
  crypto.getRandomValues(randomness);
  var passed = (randomness.length === 1000);
  for (var i = 0; i < randomness.length; i++) {
    passed = passed && (randomness[i] >= 0) && (randomness[i] <= 65535);
  }
  if (passed) {
    friend.emit('message', 'got message: ' + msg);
  };
});
