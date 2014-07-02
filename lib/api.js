var onMsg = function() {};

exports.api = {
  freedomTransmit: function(flow, msg) {
    
  },
  freedomReceive: function(cb) {
    onMsg = cb;
  }
}