var window = {
  setTimeout: setTimeout
};
var self = window;
var global = window;
var fdom = {};

exports.main = function() {
  global.importScripts = function(script) {
    try {
      console.log('getting', script);
      require(script.substr(7));
    } catch(e) {
      console.error('failed to load ' + script, e);
    }
  };

  global.freedom = fdom.setup(global, undefined, {
    portType: 'Node',
    isModule: true,
    stayLocal: true,
    location: "node://"
  });
};
