/*jslint node:true, sloppy:true */
/*globals escape,unescape*/

var vm = require('vm');
var fs = require('fs');
var crypto = require('crypto');
var NodeLink = require('./link');
var link = new NodeLink();
var es6promise = require('es6-promise').Promise;
var Intl = require('intl');

// compute freedom.js source.
var src = fs.readFileSync(require.resolve('freedom/freedom'));

var freedomVM;

// Create Base Context.
var context = {
  // setTimeout - for delaying async / implementing promises.
  setTimeout: function (cb, time) {
    setTimeout(cb, time);
  },
  clearTimeout: function (id) {
    clearTimeout(id);
  },
  setInterval: function (cb, time) {
    setInterval(cb, time);
  },
  clearInterval: function (id) {
    clearInterval(id);
  },
  // postMessage - sending messages out of the module.
  postMessage: function (msg) {
    // Convert binary blobs into native buffers pre-send
    if (msg && msg.message && msg.message.message &&
        msg.message.message.binary) {
      var out = [], i = 0;
      for (i = 0; i < msg.message.message.binary.length; i += 1) {
        out.push(new Buffer(new Uint8Array(msg.message.message.binary[i])));
      }
      msg.message.message.binary = out;
    }
    process.send(msg);
  },
  // onMessage - sending messages into the module.
  _om: null,
  addEventListener: function (type, cb) {
    if (type === 'message' && !context._om) {
      context._om = cb;
    }
  },
  Array: Array,
  ArrayBuffer: ArrayBuffer,
  Boolean: Boolean,
  DataView: DataView,
  Date: Date,
  Error: Error,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
  Infinity: Infinity,
  Int8Array: Int8Array,
  Int16Array: Int16Array,
  Int32Array: Int32Array,
  Intl: Intl,
  JSON: JSON,
  Math: Math,
  NaN: NaN,
  Number: Number,
  Object: Object,
  Promise: es6promise,
  RangeError: RangeError,
  RegExp: RegExp,
  String: String,
  SyntaxError: SyntaxError,
  URIError: URIError,
  Uint8Array: Uint8Array,
  Uint16Array: Uint16Array,
  Uint32Array: Uint32Array,
  Uint8ClampedArray: Uint8ClampedArray,
  console: console,
  decodeURI: decodeURI,
  decodeURIComponent: decodeURIComponent,
  encodeURI: encodeURI,
  encodeURIComponent: encodeURIComponent,
  escape: escape,
  isFinite: isFinite,
  isNaN: isNaN,
  parseFloat: parseFloat,
  parseInt: parseInt,
  undefined: undefined,
  unescape: unescape,
  Buffer: Buffer,
  crypto: {
      getRandomValues: function (typedarray) {
        var buf = crypto.randomBytes(typedarray.length * typedarray.BYTES_PER_ELEMENT);
        var view = new DataView(typedarray.buffer);
        for (var i = 0; i < buf.length; i++) {
          view.setUint8(i, buf[i]);
        }
      }
  },
  // importScripts - Loading code into the module.
  importScripts: function (script) {
    var file, name;
    try {
      //TODO: enforce constrained location of loaded files.
      if (script.indexOf('node://') === 0) {
        name = script.substr(7);
      }
      file = fs.readFileSync(name);
      vm.runInContext(file, freedomVM, name);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
};
context.global = context;

freedomVM = vm.createContext(context);
//console.log('Starting VM Context');
try {
  vm.runInContext(src, freedomVM, 'freedom.js.vm');
} catch (e) {
  // Report Syntax error.
  process.send(e);
  console.error(e);
  process.exit(1);
}

process.on('message', function (msg) {
  if (context._om) {
    link.fix(msg.message);
    context._om({data: msg});
  } else {
    console.warn('Message dropped - VM not ready');
  }
});
