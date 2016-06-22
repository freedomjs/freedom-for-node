/*globals require, console, Uint8Array */
/*jslint node:true,sloppy:true */

/**
 * A freedom.js tcp socket provider on Node Streams
 * @constructor
 * @private
 * @param {fdom.Port} channel the module creating this provider.
 * @param {Function} dispatchEvent Method for emitting events.
 * @param {number} id The identifier of the socket, if it exposing
 * a pre-existing accepted socket.
 */
var TcpSocket_node = function (cap, dispatchEvent, id) {
  this.dispatchEvent = dispatchEvent;
  this.net = require('net');
  this.tlsconnect = require('tls-connect');

  this.state = TcpSocket_node.state.NEW;
  this.servername = undefined;

  if (id !== undefined && TcpSocket_node.unbound[id]) {
    this.id = id;
    this.connection = TcpSocket_node.unbound[id];
    this.state = TcpSocket_node.connectionState[id];
    delete TcpSocket_node.unbound[id];
    this.attachListeners();
  } else {
    this.id = TcpSocket_node.baseId += 1;
  }
  TcpSocket_node.connectionState[this.id] = this.state;
};

TcpSocket_node.unbound = {};
TcpSocket_node.baseId = 1;
TcpSocket_node.connectionState = {};

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
TcpSocket_node.prototype.write = function (data, callback) {
  console.log("CALLING WRITE!!");
  console.info(data);
  console.info(typeof data);
  console.info(data.byteLength);
  if (this.state !== TcpSocket_node.state.CONNECTED) {
    callback(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot Write on Closed Socket"
    });
    return;
  }
  var buffer = new Buffer(new Uint8Array(data));
  console.info(buffer);
  this.connection.write(buffer, 'utf8', callback);
};

/**
 * Pause the socket
 * @method pause
 * @param {Function} callback Function to call after pausing the socket.
 */
TcpSocket_node.prototype.pause = function (callback) {
  if (this.state !== TcpSocket_node.state.CONNECTED) {
    callback(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot pause a closed socket"
    });
    return;
  }
  this.connection.pause();
  callback();
};

/**
 * Resume the socket
 * @method resume
 * @param {Function} callback Function to call after resuming the socket.
 */
TcpSocket_node.prototype.resume = function (callback) {
  if (this.state !== TcpSocket_node.state.CONNECTED) {
    callback(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot resume a closed socket"
    });
    return;
  }
  this.connection.resume();
  callback();
};

/**
 * Get information about an active socket.
 * @method getInfo
 * @param {Function} callback function to call with socket info.
 */
TcpSocket_node.prototype.getInfo = function (callback) {
  if (this.state === TcpSocket_node.state.NEW) {
    return callback({
      connected: false
    });
  } else {
    callback({
      type: 'tcp',
      connected: this.state === TcpSocket_node.state.CONNECTED,
      peerAddress: this.connection.remoteAddress,
      peerPort: this.connection.remotePort,
      localAddress: this.connection.address().address,
      localPort: this.connection.address().port
    });
  }
};

/**
 * Prepares a socket for becoming secure, currently a no-op in node.
 * Details at https://github.com/freedomjs/freedom/wiki/prepareSecure-API-Usage
 * @method prepareSecure
 * @param {Function} callback function to call on completion or error.
 */
TcpSocket_node.prototype.prepareSecure = function (callback) {
  callback();
};

/**
 * Secure a socket, such that subsequent methods are sent over a TLS channel.
 * @method secure
 * @param {Function} callback function to call on completion or error.
 */
TcpSocket_node.prototype.secure = function (callback) {
  if (this.state !== TcpSocket_node.state.CONNECTED) {
    callback(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot secure closed socket"
    });
    return;
  }
  var cleartext = this.tlsconnect({
    socket: this.connection,
    rejectUnauthorized: true,
    requestCert: true,
    isServer: false,
    servername: this.servername
  }, function () {
    if (!cleartext.authorized) {
      this.connection.destroy();
      this.state = TcpSocket_node.state.CLOSED;
      TcpSocket_node.connectionState[this.id] = this.state;
      callback(undefined, {
        "errcode": "CONNECTION_RESET",
        "message": "Failed to secure socket."
      });
    } else {
      this.upgradeConnection(cleartext);
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
TcpSocket_node.prototype.connect = function (hostname, port, cb) {
  console.log("CONNECTING");
  if (this.state !== TcpSocket_node.state.NEW) {
    return cb(undefined, {
      "errcode": "ALREADY_CONNECTED",
      "message": "Cannot Connect Existing Socket"
    });
  }

  try {
    this.state = TcpSocket_node.state.CONNECTING;
    TcpSocket_node.connectionState[this.id] = this.state;
    this.servername = hostname;
    this.connection = this.net.connect(port, hostname);
    this.callback = cb;
    this.attachListeners();
  } catch (e) {
    this.onError(e);
  }
};

TcpSocket_node.prototype.attachListeners = function () {
  if (!this.listeners) {
    this.listeners = {
      'data': this.onData.bind(this),
      'end': this.onEnd.bind(this),
      'timeout': this.onEnd.bind(this),
      'error': this.onError.bind(this),
      'connect': this.onConnect.bind(this, 0)
    };
  }

  for (var key in this.listeners) {
    if (this.listeners.hasOwnProperty(key)) {
      this.connection.on(key, this.listeners[key]);
    }
  }
};

TcpSocket_node.prototype.upgradeConnection = function (newConn) {
  for (var key in this.listeners) {
    if (this.listeners.hasOwnProperty(key)) {
      this.connection.removeListener(key, this.listeners[key]);
    }
  }
  this.connection = newConn;
  this.attachListeners();
};

TcpSocket_node.prototype.onConnect = function (status) {
  if (this.state === TcpSocket_node.state.CONNECTING) {
    this.state = TcpSocket_node.state.CONNECTED;
    TcpSocket_node.connectionState[this.id] = this.state;
  } else if (this.state === TcpSocket_node.state.BINDING) {
    this.state = TcpSocket_node.state.LISTENING;
    TcpSocket_node.connectionState[this.id] = this.state;
  } else if (this.state === TcpSocket_node.state.CONNECTED &&
             this.connection.authorized === true) {
    // Socket secured.
    return;
  } else {
    console.warn('Connection on invalid state socket!', this.state);
    return;
  }

  if (this.callback) {
    this.callback(status);
    delete this.callback;
  }
};

TcpSocket_node.prototype.onError = function (error) {
  if (this.state === TcpSocket_node.state.CONNECTING) {
    this.callback(undefined, {
      "errcode": "CONNECTION_FAILED",
      "message": "Socket Error: " + error.message
    });
    delete this.callback;
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
    TcpSocket_node.connectionState[this.id] = this.state;
    return;
  } else if (this.state === TcpSocket_node.state.CONNECTED) {
    console.warn('Socket Error: ' + error);
    this.dispatchEvent('onDisconnect', {
      "errcode": "SOCKET_CLOSED",
      "message": "Socket Error: " + error.message
    });
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
    TcpSocket_node.connectionState[this.id] = this.state;
    return;
  } else {
    console.warn('Socket Error: ' + error);
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
    TcpSocket_node.connectionState[this.id] = this.state;
    return;
  }
};

TcpSocket_node.prototype.onEnd = function () {
  this.dispatchEvent('onDisconnect', {
    "errcode": "CONNECTION_CLOSED",
    "message": "Connection closed gracefully"
  });
  delete this.connection;
  this.state = TcpSocket_node.state.CLOSED;
  TcpSocket_node.connectionState[this.id] = this.state;
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
TcpSocket_node.prototype.onData = function (data) {
  console.info("ON DATA!");
  console.info(data);
  console.info(typeof data);
  var arrayBuffer = new Uint8Array(data).buffer;
  console.info(arrayBuffer.byteLength);
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
TcpSocket_node.prototype.listen = function (address, port, callback) {
  console.log("LISTENING");
  if (this.state !== TcpSocket_node.state.NEW) {
    callback(undefined, {
      "errcode": "ALREADY_CONNECTED",
      "message": "Cannot Listen on existing socket."
    });
    return;
  }

  this.connection = this.net.createServer();
  this.callback = callback;
  this.state = TcpSocket_node.state.BINDING;
  TcpSocket_node.connectionState[this.id] = this.state;

  this.connection.on('error', this.onError.bind(this));
  this.connection.on('listening', this.onConnect.bind(this, undefined));
  this.connection.on('close', this.onEnd.bind(this));
  this.connection.on('connection', this.onAccept.bind(this));

  this.connection.listen(port, address);
};

TcpSocket_node.prototype.onAccept = function (connection) {
  TcpSocket_node.unbound[this.id] = connection;

  this.dispatchEvent('onConnection', {
    'socket': this.id,
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
TcpSocket_node.prototype.close = function (continuation) {
  if (this.connection) {
    if (this.state === TcpSocket_node.state.BINDING ||
        this.state === TcpSocket_node.state.LISTENING) {
      this.connection.close(continuation);
    } else {
      this.connection.destroy();
      continuation();
    }
    delete this.connection;
    this.state = TcpSocket_node.state.CLOSED;
    TcpSocket_node.connectionState[this.id] = this.state;
  } else {
    continuation(undefined, {
      "errcode": "SOCKET_CLOSED",
      "message": "Socket already closed."
    });
  }
};

/** REGISTER PROVIDER **/
exports.provider = TcpSocket_node;
exports.name = 'core.tcpsocket';
