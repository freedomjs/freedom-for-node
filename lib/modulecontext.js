var vm = require('vm');
var fs = require('fs');

// compute freedom.js source.
var src = fs.readFileSync(__dirname + '/moduleentry.js'),
    fileInfo = require('freedom'),
    glob = require('glob'),
    freedomPrefix = require.resolve('freedom').substr(0,
        require.resolve('freedom').lastIndexOf('freedom') + 8);

src += fs.readFileSync(require.resolve('es6-promise/dist/promise-1.0.0'));

fileInfo.FILES.srcCore.concat(
    fileInfo.FILES.srcPlatform).forEach(function(dir) {
  glob.sync(freedomPrefix + '/' +  dir).forEach(function(file) {
    src += fs.readFileSync(file);
  });
});
glob.sync(__dirname + '/../providers/*.js').forEach(function(file) {
  src += fs.readFileSync(file);
});

// Create Minimal Context.
var context = {
  setTimeout: function(cb, time) {
    setTimeout(cb, time);
  },
  postMessage: function(msg) {
    process.send(msg);
  },
  _om: null,
  onMessage: function(cb) {
    context._om = cb;
  },
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
    context._om(msg);
  } else {
    console.warn('Message dropped - VM not ready');
  }
});
