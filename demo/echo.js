/*globals freedom, console */

(function () {
    'use strict';

    var sid = 0,
        socket = freedom['core.tcpsocket'](),
        onClient;
  
    console.warn('running!');

    socket.listen('localhost', '8080');
    socket.on('onConnection', function(acceptInfo) {
      var child = freedom['core.tcpsocket'](acceptInfo.socket);
      child.on('onData', function(readInfo) {
        child.write(readInfo.data);
      });
    });
}());
