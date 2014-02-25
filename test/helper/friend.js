freedom.on('message', function(msg) {
  freedom.emit('message', 'got message: ' + msg);
});
