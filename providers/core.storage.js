/*jslint node:true,nomen:true */

/**
 * A storage provider using node and the json-store module.
 * @constructor
 */
var Storage_node = function (cap, dispatch) {
  'use strict';
  this.store = require('json-store')(__dirname + '/../freedomjs-database.json');
  this.dispatchEvents = dispatch;
};

Storage_node.prototype.get = function (key, continuation) {
  'use strict';
  try {
    var val = this.store.get(key);
    if (typeof val !== 'undefined') {
      continuation(val);
    } else {
      continuation(null);
    }
  } catch (e) {
    continuation(null);
  }
};

Storage_node.prototype.keys = function (continuation) {
  'use strict';
  var dict = this.store.get();
  continuation(Object.keys(dict));
};

Storage_node.prototype.set = function (key, value, continuation) {
  'use strict';
  var old = this.store.get(key);
  this.store.set(key, value);
  continuation(old);
};

Storage_node.prototype.remove = function (key, continuation) {
  'use strict';
  var old = this.store.get(key);
  this.store.del(key);
  continuation(old);
};

Storage_node.prototype.clear = function (continuation) {
  'use strict';
  this.store.Store = {};
  this.store.save();
  continuation();
};

/** REGISTER PROVIDER **/
exports.provider = Storage_node;
exports.name = 'core.storage';
