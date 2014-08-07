exports.main = function() {
  var global = {};
  global.importScripts = function(script) {
    try {
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
