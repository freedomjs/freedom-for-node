var onMsg = function() {};

console.log(connection);

exports.api = {
  freedomTransmit: function(flow, msg) {
    console.log('asked to push up ', flow, msg);
  },
  freedomReceive: function(cb) {
    onMsg = cb;
  },
  setTimeout: function(cb, timeout) {
    setTimeout(cb, timeout);
  }
}
