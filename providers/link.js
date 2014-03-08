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
  if (this.config.appContext) {
    this.obj = process;
    this.obj.on('message', this.emitMessage.bind(this) , true);
  } else {
    console.warn('making child!');

    this.obj = require('child_process').fork(__dirname + '/../index.js');
    
    this.obj.on('message', this.emitMessage.bind(this) , true);
    this.obj.on('close', function() {
      delete this.obj;
    }.bind(this));
    this.obj.on('error', function(err) {
      fdom.debug.error(err);
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
  if (this.config.appContext) {
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
    if (this === this.config.global.directLink) {
      console.warn('->[' + flow + '] ' + JSON.stringify(message));
    } else {
      console.warn('<-[' + flow + '] ' + JSON.stringify(message));
    }
    */
    this.obj.send({tag: flow, msg: message});
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

