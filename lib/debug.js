
var Debug = function() {
  "use strict";
  this._debug = false;
  this._debugPort = 5858;
  this._checkDebug();
};

Debug.prototype._checkDebug = function() {
  "use strict";
  var arg, equalsIndex, i; 
  for (i=0; i<process.execArgv.length; i++) {
    arg = process.execArgv[i];
    if (arg.indexOf("--debug") === 0) {
      this._debug = true;
      equalsIndex = arg.indexOf("=");
      if (equalsIndex >= 0) {
        this._debugPort = parseInt(arg.slice(equalsIndex+1));
      } else {
        this._debugPort = 5858;
      }
      return;
    }
  }
};

Debug.prototype.next = function() {
  "use strict";
  this._debugPort += 1;
  return this._debugPort;
};

Debug.prototype.nextExecArgv = function() {
  "use strict";
  var port = this.next();
  var argv = process.execArgv;
  for (var i=0; i<argv.length; i++) {
    if (argv[i].indexOf("--debug") === 0) {
      argv[i] = "--debug="+port;
    }
  }
  return argv;
};

var debug = new Debug();
module.exports = debug;
