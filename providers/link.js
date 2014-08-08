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
  this.queue = [];
};

/**
 * Start this port.
 * @method start
 * @private
 */
fdom.link.Node.prototype.start = function() {
  if (this.config.moduleContext) {
    this.deliverMessage = function(flow, msg) {
      runTask('sendMessage', {flow: flow, msg: msg});
    };
    exports.onSendMessageTask = this.emitMessage.bind(this);
  } else {
    console.log('making link');
    // create API
    var api = __dirname + "/../lib/api.js";

    var SandCastle = require('sandcastle').SandCastle;
    this.sandcastle = new SandCastle({
      api: api
    });
    fdom.sc = this.sandcastle;
    
    // concatinate freedom into script.
    var src = this.config.src;
    
    // Make the script.
    this.obj = this.sandcastle.createScript(src);
    fdom.ob = this.obj;

    this.obj.on("task", function(err, options, method, cb) {
      if (method == 'sendMessage' && options.flow) {
        this.emitMessage(options.flow, options.msg);
      }
      if (this.queue.length) {
        cb(this.queue);
        this.queue = [];
      }
    }.bind(this));

    this.obj.on("exit", function(data) {
      console.log('sandcastle exited.', data);
      delete this.sandcastle;
    }.bind(this));

    this.obj.on("error", function(err) {
      console.error(err);
      fdom.debug.error(err);
    });

    this.obj.run('main');
    this.obj.reset(); // clears time limit on execution.
    console.log('sandbox running.');

    this.emit('started');
  }
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
fdom.link.Node.prototype.stop = function() {
  if (!this.config.moduleContext) {
    this.obj.kickOverSandCastle();
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
  //- For Debugging Purposes -
  if (!this.config.moduleContext) {
    console.warn('->[' + flow + '] ' + JSON.stringify(message));
  } else {
    console.warn('<-[' + flow + '] ' + JSON.stringify(message));
  }

  if(this.config.moduleContext) {
    // Convert binary blobs into native buffers pre-send
    if (message && message.message && message.message.binary) {
      var out = [], i = 0;
      for (i = 0; i < message.message.binary.length; i += 1) {
        out.push(new Buffer(new Uint8Array(message.message.binary[i])));
      }
      message.message.binary = out;
    }

    this.deliverMessage(flow, message);
  } else if (this.obj) {
    // Convert binary blobs into native buffers pre-send
    if (message && message.message && message.message.binary) {
      var out = [], i = 0;
      for (i = 0; i < message.message.binary.length; i += 1) {
        out.push(new Buffer(new Uint8Array(message.message.binary[i])));
      }
      message.message.binary = out;
    }

    this.queue.push({flow: flow, msg: message});
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

/**
 * Rewrite node buffers back to array buffers.
 */
fdom.link.Node.prototype.fix = function(message) {
  if (message && message.message && message.message.binary) {
    var out = [], i = 0;
    for (i = 0; i < message.message.binary.length; i += 1) {
      out.push(new Uint8Array(message.message.binary[i]).buffer);
    }
    message.message.binary = out;
  }
};

