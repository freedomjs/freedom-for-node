/*globals freedom, console */

(function () {
    'use strict';

    var sid = 0,
        socket = freedom['core.socket'](),
        onClient;
  
    console.warn('running!');

    socket.create('tcp', {}).then(function (socketId) {
        sid = socketId;
        return socket.listen(socketId, 'localhost', 8080);
    }).then(function (listen) {
        socket.on('onData', function (readInfo) {
            socket.write(readInfo.socketId, readInfo.data);
        });
    }, function (error) {
        console.error(error);
    });
}());