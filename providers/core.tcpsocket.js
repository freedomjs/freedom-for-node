/*globals require,fdom:true, console */
/*jslint indent:2,white:true,sloppy:true */

/**
 * A freedom.js tcp socket provider on Node Streams
 * @constructor
 * @private
 * @param {fdom.Port} channel the module creating this provider.
 * @param {Function} dispatchEvent Method for emitting events.
 * @param {number} id The identifier of the socket, if it exposing
 * a pre-existing accepted socket.
 */
var TcpSocket_node = function(channel, dispatchEvent, id) {
  this.dispatchEvent = dispatchEvent;
  this.net = require('net');
  this.tlsconnect = require('tls-connect');

  this.state = TcpSocket_node.state.NEW;

  if (id !== undefined && TcpSocket_node.unbound[id]) {
    this.state = TcpSocket_node.state.CONNECTED;
    this.connection = TcpSocket_node.unbound[id];
    delete TcpSocket_node.unbound[id];
    this.attachListeners();
  }
};

TcpSocket_node.unbound = {};
TcpSocket_node.unboundId = 1;

TcpSocket_node.state = {
  NEW: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  CLOSED: 3,
  BINDING: 4,
  LISTENING: 5
};

/**
 * Write a buffer of data to the socket
 * @method write
 * @param {ArrayBuffer} data The data to write
 * @param {Function} callback Function to call after completion or error.
 */
TcpSocket_node.prototype.write = function(data, callback) {
  if (this.state !== TcpSocket_node.state.CONNECTED) {
    callback(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot Write on Closed Socket"
    });
    return;
  }
  var buffer = new Buffer(new Uint8Array(data));
  this.connection.write(buffer, 'utf8', callback);
};

/**
 * Get information about an active socket.
 * @method getInfo
 * @param {Function} callback function to call with socket info.
 */
TcpSocket_node.prototype.getInfo = function(callback) {
  if (this.state === TcpSocket_node.state.NEW) {
    return callback({
      connected: false
    });
  } else {
    callback({
      type: 'tcp',
      connected: this.connection.state === TcpSocket_node.state.CONNECTED,
      peerAddress: this.connection.remoteAddress,
      peerPort: this.connection.remotePort,
      localAddress: this.connection.localAddress,
      localPort: this.connection.localPort
    });
  }
};

/**
 * Prepares a socket for becoming secure, currently a no-op in node.
 * Details at https://github.com/freedomjs/freedom/wiki/prepareSecure-API-Usage
 * @method prepareSecure
 * @param {Function} callback function to call on completion or error.
 */
TcpSocket_node.prototype.prepareSecure = function(callback) {
  callback();
};

/**
 * Secure a socket, such that subsequent methods are sent over a TLS channel.
 * @method secure
 * @param {Function} callback function to call on completion or error.
 */
TcpSocket_node.prototype.secure = function(callback) {
  if (this.state !== TcpSocket_node.state.CONNECTED) {
    callback(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot secure closed socket"
    });
    return;
  }
  this.tlsconnect({
        socket: this.connection,
        rejectUnauthorized: true,
        requestCert: true,
        isServer: false
    }, function() {
    if (!this.connection.authorized) {
      this.connection.destroy();
      this.state = TcpSocket_node.state.CLOSED;
      callback(undefined, {
        "errcode": "CONNECTION_RESET",
        "message": "Failed to secure socket."
      });
    } else {
      callback();
    }
  }.bind(this));
};

/**
 * Connect to a designated location and begin reading.
 * @method connect
 * @param {String} hostname The host or ip to connect to.
 * @param {number} port The port to connect on.
 * @param {Function} cb Function to call with completion or error.
 */
TcpSocket_node.prototype.connect = function(hostname, port, cb) {
  if (this.state !== TcpSocket_node.state.NEW) {
    console.warn('Attempting to connect on in use socket');
    return cb(undefined, {
      "errcode": "ALREADY_CONNECTED",
      "message": "Cannot Connect Existing Socket"
    });
  }
  
  this.connection = this.net.connect(port, hostname);
  this.state = TcpSocket_node.state.CONNECTING;
  this.callback = cb;
  this.attachListeners();
};

TcpSocket_node.prototype.attachListeners = function() {
  this.connection.on('data', this.onData.bind(this));
  this.connection.on('end', this.onEnd.bind(this));
  this.connection.on('timeout', this.onEnd.bind(this));
  this.connection.on('error', this.onError.bind(this));
  this.connection.on('connect', this.onConnect.bind(this, 0));
};

TcpSocket_node.prototype.onConnect = function(status) {
  if (this.state === TcpSocket_node.state.CONNECTING) {
    this.state = TcpSocket_node.state.CONNECTED;
  } else if (this.state === TcpSocket_node.state.BINDING) {
    this.state = TcpSocket_node.state.LISTENING;
  } else {
    console.warn('Connection on invalid state socket!');
    return;
  }

  if (this.callback) {
    this.callback(status);
    delete this.callback;
  }
};

TcpSocket_node.prototype.onError = function(error) {
  if (this.state === TcpSocket_node.state.CONNECTING) {
    this.callback(undefined, {
      "errcode": "CONNECTION_FAILED",
      message: "Socket Error: " + error.message
    });
    delete this.callback;
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
    return;
  }

  if (this.state === TcpSocket_node.state.CONNECTED) {
    console.warn('Socket Error: ' + error);
    this.dispatchEvent('onDisconnect', {
      errcode: "SOCKET_CLOSED",
      message: "Socket Error: " + error.message
    });
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
  }
};

TcpSocket_node.prototype.onEnd = function(socketId) {
    this.dispatchEvent('onDisconnect', {
      errcode: 'CONNECTION_CLOSED',
      message: 'Connection closed gracefully'
    });
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
};

TcpSocket_node.ERROR_MAP = {
  '-1': 'IO_PENDING',
  '-2': 'FAILED',
  '-3': 'ABORTED',
  '-4': 'INVALID_ARGUMENT',
  '-5': 'INVALID_HANDLE',
  '-7': 'TIMED_OUT',
  '-13': 'OUT_OF_MEMORY',
  '-15': 'SOCKET_NOT_CONNECTED',
  '-21': 'NETWORK_CHANGED',
  '-23': 'SOCKET_IS_CONNECTED',
  '-100': 'CONNECTION_CLOSED',
  '-101': 'CONNECTION_RESET',
  '-102': 'CONNECTION_REFUSED',
  '-103': 'CONNECTION_ABORTED',
  '-104': 'CONNECTION_FAILED',
  '-105': 'NAME_NOT_RESOLVED',
  '-106': 'INTERNET_DISCONNECTED'
};

/*
 * Read data on a socket in an event loop until the socket is closed or an
 * error occurs.
 * @method read
 * @private
 */
TcpSocket_node.prototype.onData = function(data) {
  var arrayBuffer = new Uint8Array(data).buffer;
  this.dispatchEvent('onData', {
    data: arrayBuffer
  });
};

/**
 * Listen on a socket to accept new clients.
 * @method listen
 * @param {String} address the address to listen on
 * @param {number} port the port to listen on
 * @param {Function} callback Callback to call when listening has occured.
 */
TcpSocket_node.prototype.listen = function(address, port, callback) {
  if (this.state !== TcpSocket_node.state.NEW) {
    callback(undefined, {
      errcode: "ALREADY_CONNECTED",
      message: "Cannot Listen on existing socket."
    });
    return;
  }

  this.connection = this.net.createServer();
  this.callback = callback;
  this.state = TcpSocket_node.state.BINDING;

  this.connection.on('error', this.onError.bind(this));
  this.connection.on('listening', this.onConnect.bind(this, undefined));
  this.connection.on('close', this.onEnd.bind(this));
  this.connection.on('connection', this.onAccept.bind(this));

  this.connection.listen(port, address);
};

TcpSocket_node.prototype.onAccept = function(connection) {
  var id = TcpSocket_node.unboundId += 1;
  TcpSocket_node.unbound[id] = connection;
  
  this.dispatchEvent('onConnection', {
    'socket': id,
    'host': connection.remoteAddress,
    'port': connection.remotePort
  });
  //TODO: initial incoming data may be dropped if received before bound.
};

/**
 * Close a socket
 * @method disconnect
 * @param {number} socketId The socket to disconnect
 * @param {Function} continuation Function to call once socket is disconnected.
 */
TcpSocket_node.prototype.close = function(continuation) {
  if (this.connection) {
    if (this.state === TcpSocket_node.state.BINDING ||
        this.state === TcpSocket_node.state.LISTENING) {
      this.connection.close();
    } else {
      this.connection.end();
    }
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
  }
  continuation();
};

/** REGISTER PROVIDER **/
exports.provider = TcpSocket_node;
exports.name = 'core.tcpsocket';
