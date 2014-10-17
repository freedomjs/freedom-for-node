/*jslint indent:2, white:true, node:true, sloppy:true */
var Link = require('freedom/src/link');

/**
 * A port providing message transport between two freedom contexts existing in
 * separate Node.js VMs.  Uses node's 'require("vm")' to generate a separate
 * namespace with a shared global object for communication. The module-side
 * implementation is in @see(lib/modulecontext.js)
 * @class NodeLink
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
var NodeLink = function(id, resource) {
  Link.call(this, id, resource);
  this.started = false;
};

/**
 * Start this port.
 * @method start
 * @private
 */
NodeLink.prototype.start = function() {
  this.obj = require('child_process').fork(__dirname + '/../index.js');

  this.obj.on('message', function(msg) {
    if (!this.started) {
      this.emit('started');
      this.started = true;
      return;
    }
    this.fix(msg.message);
    this.emitMessage(msg.flow, msg.message);
  }.bind(this), true);
  this.obj.on('close', function() {
    delete this.obj;
    this.emitMessage('control', {type: 'close'});
  }.bind(this));
  this.obj.on('error', function(err) {
    this.resource.debug.error(err);
    delete this.obj;
    this.emitMessage('control', {type: 'close'});
  });
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
NodeLink.prototype.stop = function() {
  if (this.config.moduleContext) {
    process.exit();
  } else {
    this.obj.kill();
    delete this.obj;
  }
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
NodeLink.prototype.toString = function() {
  return "[NodeLink " + this.id + "]";
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
NodeLink.prototype.deliverMessage = function(flow, message) {
  if (this.obj) {
    /* //- For Debugging Purposes -
    if (!this.config.moduleContext) {
      console.warn('->[' + flow + '] ' + JSON.stringify(message));
    } else {
      console.warn('<-[' + flow + '] ' + JSON.stringify(message));
    }
    */

    // Convert binary blobs into native buffers pre-send
    if (message && message.message && message.message.binary) {
      var out = [], i = 0;
      for (i = 0; i < message.message.binary.length; i += 1) {
        out.push(new Buffer(new Uint8Array(message.message.binary[i])));
      }
      message.message.binary = out;
    }
    this.obj.send({flow: flow, message: message});
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

/**
 * Rewrite node buffers back to array buffers.
 */
NodeLink.prototype.fix = function(message) {
  if (message && message.message && message.message.message) {
    message.message.message = this.replaceBuffers(message.message.message);
    //console.log(message.message.message);
  }
  if (message && message.message && message.message.binary) {
    var out = [], i = 0;
    for (i = 0; i < message.message.binary.length;i += 1) {
      out.push(new Uint8Array(message.message.binary[i]).buffer);
    }
    message.message.binary = out;
  }
};

NodeLink.prototype.replaceBuffers = function(msg) {
  var retValue, i;
  if (typeof msg === 'object' && msg && msg.byteLength) {
    retValue = msg;
    try {
      retValue = new Uint8Array(new ArrayBuffer(msg.byteLength));
      for (i = 0; i < msg.byteLength; i+= 1) {
        retValue[i] = msg[i];
      }
    } catch (e) {
      console.error("Failed to convert ArrayBuffer");
    }
    return retValue;
  } else if (Array.isArray(msg)) {
    return msg.map(this.replaceBuffers.bind(this));
  } else if (typeof msg === 'object') {
    for (i in msg) {
      if (msg.hasOwnProperty(i)) {
        msg[i] = this.replaceBuffers(msg[i]);
      }
    }
    return msg;
  } else {
    return msg;
  }
};

module.exports = NodeLink;
