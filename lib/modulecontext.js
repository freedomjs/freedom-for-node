var vm = require('vm');
var fs = require('fs');
var NodeLink = require('../providers/link');
link = new NodeLink();

// compute freedom.js source.
var src = fs.readFileSync(require.resolve('freedom/freedom'));

// Create Minimal Context.
var context = {
  // setTimeout - for delaying async / implementing promises.
  setTimeout: function(cb, time) {
    setTimeout(cb, time);
  },
  clearTimeout: function(id) {
    clearTimeout(id);
  },
  // postMessage - sending messages out of the module.
  postMessage: function(msg) {
    if (msg.msg) {
      link.fix(msg.msg);
    }
    process.send(msg);
  },
  // onMessage - sending messages into the module.
  _om: null,
  addEventListener: function(type, cb) {
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
  importScripts: function(script) {
    try {
      var file = fs.readFileSync(script.substr(7));
      vm.runInContext(file, freedomVM, script.substr(7));
    } catch(e) {
      console.error(e);
      process.exit(1);
    }
  }
};
context.global = context;

var freedomVM = vm.createContext(context);
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
    context._om({data: msg});
  } else {
    console.warn('Message dropped - VM not ready');
  }
});
