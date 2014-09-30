/*globals require, console */
/*jslint indent:2,white:true,sloppy:true */

/**
 * A freedom.js udp socket provider on Node Streams
 * @constructor
 * @private
 * @param {Port} channel the module creating this provider.
 * @param {Function} dispatchEvent Method for emitting events.
 */
var UdpSocket_node = function(channel, dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.dgram = require('dgram');

  this.state = UdpSocket_node.state.NEW;
};

UdpSocket_node.state = {
  NEW: 0,
  BINDING: 1,
  OPEN: 2,
  CLOSED: 3
};

UdpSocket_node.prototype.getInfo = function(callback) {
  if (this.state === UdpSocket_node.state.NEW ||
     this.state === UdpSocket_node.state.CLOSED) {
    return callback({});
  } else {
    callback({
      localAddress: this.connection.address().address,
      localPort: this.connection.address().port
    });
  }
};

UdpSocket_node.prototype.sendTo = function(data, host, port, callback) {
  if (this.state !== UdpSocket_node.state.OPEN) {
    callback(undefined, {
      errcode: "SOCKET_CLOSED",
      message: "Cannot Write on non-connected Socket"
    });
    return;
  }
  var buffer = new Buffer(new Uint8Array(data));
  this.connection.send(buffer, 0, buffer.length, port, host, function(err, bytes) {
    if (err) {
      callback(undefined, {
        errcode: "",
        message: "Send Failed " + err
      });
    } else {
      callback(bytes);
    }
  });
};

/**
 * Connect to a designated location and begin reading.
 * @method bind
 * @param {String} hostname The local host to bind to.
 * @param {number} port The port to bind on.
 * @param {Function} cb Function to call with completion or error.
 */
UdpSocket_node.prototype.bind = function(hostname, port, cb) {
  if (this.state !== UdpSocket_node.state.NEW) {
    console.warn('Attempting to connect on in use socket');
    return cb(false);
  }
  
  this.connection = this.dgram.createSocket('udp4');
  this.state = UdpSocket_node.state.BINDING;
  this.callback = cb;
  
  this.connection.on('message', this.onMessage.bind(this));
  this.connection.on('error', this.onError.bind(this));
  this.connection.bind(port, hostname, this.onConnect.bind(this));
};

UdpSocket_node.prototype.onConnect = function() {
  if (this.state === UdpSocket_node.state.BINDING) {
    this.state = UdpSocket_node.state.OPEN;
  } else {
    console.warn('Connection on invalid state socket!');
    return;
  }

  if (this.callback) {
    this.callback(0);
    delete this.callback;
  }
};

UdpSocket_node.prototype.onError = function(error) {
  if (this.state === UdpSocket_node.state.BINDING) {
    this.callback(undefined, {
      errcode: "BIND_FAILED",
      message: "Bind Failed: " + error.message
    });
    delete this.callback;
    delete this.connection;
    this.state = UdpSocket_node.state.CLOSED;
    return;
  }

  if (this.state === UdpSocket_node.state.CONNECTED) {
    console.warn('Socket Error: ' + error);
    this.dispatchEvent('onData', {
      
      errcode: "SOCKET_CLOSED",
      message: "Socket Error: " + error.message
    });
    delete this.connection;
    this.state = UdpSocket_node.state.CLOSED;
  }
};


/*
 * Read a message from the socket.
 * @method onMessage
 * @private
 */
UdpSocket_node.prototype.onMessage = function(data, remote) {
  var arrayBuffer = new Uint8Array(data).buffer;
  this.dispatchEvent('onData', {
    resultCode: 0,
    address: remote.address,
    port: remote.port,
    data: arrayBuffer
  });
};

/**
 * Close a socket
 * @method destroy
 * @param {Function} continuation Function to call once socket is closed.
 */
UdpSocket_node.prototype.destroy = function(continuation) {
  if (this.connection) {
    this.connection.close();
    delete this.connection;
  }
  this.state = UdpSocket_node.state.CLOSED;
  continuation();
};

/** REGISTER PROVIDER **/
exports.provider = UdpSocket_node;
exports.name = 'core.udpsocket';
