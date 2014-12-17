/*global fdom*/
var window = this;
var self = this;

setTimeout(function() {
  "use strict";
  this.freedom = fdom.setup(this, undefined, {
    portType: 'Node',
    isModule: true,
    stayLocal: true,
    location: "node://"
  });
}.bind(this), 0);
