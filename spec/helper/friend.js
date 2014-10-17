var friend = freedom();

friend.on('message', function(msg) {
  friend.emit('message', 'got message: ' + msg);
});
