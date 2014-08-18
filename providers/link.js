/*globals fdom:true */
/*jslint indent:2, white:true, node:true, sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.link = fdom.link || {};

/**
 * A port providing message transport between two freedom contexts existing in
 * separate Node.js VMs.  Uses node's 'require("vm")' to generate a separate
 * namespace with a shared global object for communication.
 * @class Link.Node
 * @extends Port
 * @uses handleEvents
 * @constructor
 */
fdom.link.Node = function() {
  fdom.Link.call(this);
};

/**
 * Start this port.
 * @method start
 * @private
 */
fdom.link.Node.prototype.start = function() {
  if (this.config.moduleContext) {

    onMessage(function(msg) {
      this.fix(msg.msg);
      this.emitMessage(msg.tag, msg.msg);
    }.bind(this));
    this.obj = {
      send: postMessage
    };
  } else {
    this.obj = require('child_process').fork(__dirname + '/../index.js');

    this.obj.on('message', function(msg) {
      this.fix(msg.msg);
      this.emitMessage(msg.tag, msg.msg);
    }.bind(this), true);
    this.obj.on('close', function() {
      delete this.obj;
      this.emitMessage('control', {type: 'close'});
    }.bind(this));
    this.obj.on('error', function(err) {
      console.error(err);
      fdom.debug.error(err);
      delete this.obj;
      this.emitMessage('control', {type: 'close'});
    });

    this.emit('started');
  }
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
fdom.link.Node.prototype.stop = function() {
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
fdom.link.Node.prototype.toString = function() {
  return "[NodeLink " + this.id + "]";
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
fdom.link.Node.prototype.deliverMessage = function(flow, message) {
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
    this.obj.send({tag: flow, msg: message});
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

/**
 * Rewrite node buffers back to array buffers.
 */
fdom.link.Node.prototype.fix = function(message) {
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

fdom.link.Node.prototype.replaceBuffers = function(msg) {
  if (typeof msg == 'object' && msg.byteLength) {
    var retValue = msg;
    try {
      retValue = new ArrayBuffer(msg.byteLength);
      var view = new Uint8Array(retValue);
      for (var i=0; i<msg.byteLength; i++) {
        view[i] = msg[i];
      }
    } catch (e) {
      console.error("Failed to convert ArrayBuffer");
    }
    return retValue;
  } else if (Array.isArray(msg)) {
    return msg.map(this.replaceBuffers.bind(this));
  } else if (typeof msg == 'object') {
    for (var k in msg) {
      if (msg.hasOwnProperty(k)) {
        msg[k] = this.replaceBuffers(msg[k]);
      }
    }
    return msg;
  } else {
    return msg;
  }
}
