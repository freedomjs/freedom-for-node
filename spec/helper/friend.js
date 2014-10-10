var iface = freedom();

iface.on('message', function(msg) {
  iface.emit('message', 'got message: ' + msg);
});
