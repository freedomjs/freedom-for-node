var vm = require('vm');
var fs = require('fs');
var NodeLink = require('../providers/link');
var link = new NodeLink();

// compute freedom.js source.
var src = fs.readFileSync(require.resolve('freedom/freedom'));

var freedomVM;

// Create Minimal Context.
var context = {
  // setTimeout - for delaying async / implementing promises.
  setTimeout: function (cb, time) {
    setTimeout(cb, time);
  },
  clearTimeout: function(id) {
    clearTimeout(id);
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
  ArrayBuffer: ArrayBuffer,
  DataView: DataView,
  Uint8Array: Uint8Array,
  Uint16Array: Uint16Array,
  Buffer: Buffer,
  // importScripts - Loading code into the module.
  importScripts: function (script) {
    try {
      var file = fs.readFileSync(script.substr(7));
      vm.runInContext(file, freedomVM, script.substr(7));
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
} catch(e) {
  // Report Syntax error.
  process.send(e);
  console.error(e);
  process.exit(1);
}

process.on('message', function(msg) {
  if (context._om) {
    link.fix(msg.message);
    context._om({data: msg});
  } else {
    console.warn('Message dropped - VM not ready');
  }
});
