/*globals require,fdom:true*/
/*jslint indent:2,white:true,sloppy:true */

/**
 * A storage provider using node and the json-store module.
 * @constructor
 */
var Storage_node = function(channel, dispatch) {
  this.store = require('json-store')('freedomjs-storage.json');
  this.dispatchEvents = dispatch;
  this.channel = channel;
};

Storage_node.prototype.get = function(key, continuation) {
  try {
    var val = this.store.get(key);
    continuation(val);
  } catch(e) {
    continuation(null);
  }
};

Storage_node.prototype.set = function(key, value, continuation) {
  var old = this.store.get(key);
  this.store.set(key, value);
  continuation(old);
};

Storage_node.prototype.remove = function(key, continuation) {
  var old = this.store.get(key);
  this.store.del(key);
  continuation(old);
};

Storage_node.prototype.clear = function(continuation) {
  this.store.Store = {};
  this.store.save();
  continuation();
};

/** REGISTER PROVIDER **/
if (typeof fdom !== 'undefined') {
  fdom.apis.register("core.storage", Storage_node);
}
