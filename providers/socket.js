/*globals require,fdom:true, console */
/*jslint indent:2,white:true,sloppy:true */

/**
 * A freedom.js socket provider on Node Streams
 * @constructor
 * @private
 * @param {fdom.Port} channel the module creating this provider.
 * @param {Function} dispatchEvent Method for emitting events.
 */
var Socket_node = function(channel, dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.net = require('net');

  this.connections = {};
  this.socketCount = 0;
};

Socket_node.state = {
  NEW: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  CLOSED: 3,
  BINDING: 4,
  LISTENING: 5
};

/**
 * Create a new socket for network connections.
 * @method create
 * @param {String} type TCP or UDP
 * @param {Object} options unused
 * @param {Function} cb Callback with socket id.
 */
Socket_node.prototype.create = function(type, options, cb) {
  var id;

  this.socketCount += 1;
  id = this.socketCount;

  this.connections[id] = {
    state: Socket_node.state.NEW,
    type: type,
    obj: undefined
  };
  cb(id);
};

Socket_node.prototype.write = function(socketId, data, callback) {
  this.connections[socketId].write(data, 'utf8', callback);
};

Socket_node.prototype.getInfo = function(socketId, callback) {
  var socket = this.connections[socketId];

  if (socket.state === Socket_node.state.NEW) {
    return callback({
      type: socket.type,
      connected: false
    });
  } else {
    callback({
      type: socket.type,
      connected: socket.state === Socket_node.state.CONNECTED,
      peerAddress: socket.remoteAddress,
      peerPort: socket.remotePort,
      localAddress: socket.localAddress,
      localPort: socket.localPort
    });
  }
};

/**
 * Connect to a designated location and begin reading.
 * @method connect
 * @param {number} socketId The socket to connect.
 * @param {String} hostname The host or ip to connect to.
 * @param {number} port The port to connect on.
 * @param {Function} cb Function to call with completion or error.
 */
Socket_node.prototype.connect = function(socketId, hostname, port, cb) {
  if (this.connections[socketId].state !== Socket_node.state.NEW) {
    console.warn('Attempting to connect on in use socket');
    return cb(false);
  }
  
  if (this.connections[socketId].type !== 'tcp') {
    console.warn('Attempting to connect on non TCP socket');
    return cb(false);
  }

  var obj = this.net.connect(port, hostname);
  this.connections[socketId].obj = obj;
  this.connections[socketId].state = Socket_node.state.CONNECTING;
  this.connections[socketId].callback = cb;
  
  obj.on('data', this.onData.bind(this, socketId));
  obj.on('end', this.onEnd.bind(this, socketId));
  obj.on('timeout', this.onEnd.bind(this, socketId));
  obj.on('error', this.onError.bind(this, socketId));
  obj.on('connect', this.onConnect.bind(this, socketId));
};

Socket_node.prototype.onConnect = function(socketId) {
  if (this.connections[socketId].state === Socket_node.state.CONNECTING) {
    this.connections[socketId].state = Socket_node.state.CONNECTED;
  } else if (this.connections[socketId].state ===
      Socket_node.state.BINDING) {
    this.connections[socketId].state = Socket_node.state.LISTENING;
  } else {
    console.warn('Connection on invalid state socket!');
    return;
  }
  this.connections[socketId].state = Socket_node.state.CONNECTED;
  this.connections[socketId].callback(0);
  delete this.connections[socketId].callback;
};

Socket_node.prototype.onError = function(socketId, error) {
  if (this.connections[socketId].state === Socket_node.state.CONNECTING) {
    this.connections[socketId].callback(-2);
    delete this.connections[socketId].callback;
    delete this.connections[socketId];
    return;
  }

  if (this.connections[socketId].state === Socket_node.state.CONNECTED) {
    console.warn('Socket Error [' + socketId + ']: ' + error);
    this.dispatchEvent('onDisconnect', {
      socketId: socketId,
      error: error
    });
    delete this.connections[socketId];
  }
};

Socket_node.prototype.onEnd = function(socketId) {
  this.dispatchEvent('onDisconnect', {
    socketId: socketId,
    error: -100
  });
  delete this.connections[socketId];
};

Socket_node.ERROR_MAP = {
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
 * @param {number} socketId The socket to read on.
 */
Socket_node.prototype.onData = function(socketId, data) {
  this.dispatchEvent('onData', {
    socketId: socketId,
    data: data
  });
};

/**
 * Listen on a socket to accept new clients.
 * @method listen
 * @param {number} socketId the socket to Listen on
 * @param {String} address the address to listen on
 * @param {number} port the port to listen on
 * @param {Function} callback Callback to call when listening has occured.
 */
Socket_node.prototype.listen = function(socketId, address, port, callback) {
  if (this.connections[socketId].state !== Socket_node.state.NEW) {
    console.warn('Attempting to connect on in use socket');
    return callback(false);
  }

  var obj = this.net.createServer();
  this.connections[socketId].obj = obj;
  this.connections[socketId].callback = callback;
  this.connections[socketId].state = Socket_node.state.LISTENING;

  obj.on('error', this.onError.bind(this, socketId));
  obj.on('listening', this.onConnect.bind(this, socketId));
  obj.on('close', this.onEnd.bind(this, socketId));
  obj.on('connection', this.onAccept.bind(this, socketId));

  obj.listen(port, address);
};

Socket_node.prototype.onAccept = function(socketId, connection) {
  var id;
  this.socketCount += 1;
  id = this.socketCount;

  this.connections[id] = {
    state: Socket_node.state.CONNECTED,
    type: 'tcp',
    obj: connection
  };
  this.dispatchEvent('onConnection', {
    'serverSocketId': socketId,
    'clientSocketId': id
  });
};


/**
 * Destroy a socket
 * @method destroy
 * @param {number} socketId The socket to destroy.
 * @param {Function} continuation Function to call once socket is destroyed.
 */
Socket_node.prototype.destroy = function(socketId, continuation) {
  if (this.connections[socketId] && 
     this.connections[socketId].obj) {
    this.connections[socketId].obj.destroy();
  }
  delete this.connections[socketId];
  continuation();
};

/**
 * Disconnect a socket
 * @method disconnect
 * @param {number} socketId The socket to disconnect
 * @param {Function} continuation Function to call once socket is disconnected.
 */
Socket_node.prototype.disconnect = function(socketId, continuation) {
  if (this.connections[socketId] && 
     this.connections[socketId].obj) {
    this.connections[socketId].obj.end();
    this.connections[socketId].state = Socket_node.state.CLOSED;
  }
  continuation();
};

/** REGISTER PROVIDER **/
if (typeof fdom !== 'undefined') {
  fdom.apis.register("core.socket", Socket_node);
}
