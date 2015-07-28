/* jslint node:true, sloppy:true */

var fills = {};

fills.crypto = {
  getRandomValues: function (typedarray) {
    var buf = require('crypto').randomBytes(typedarray.length *
                                            typedarray.BYTES_PER_ELEMENT);
    var view = new DataView(typedarray.buffer);
    for (var i = 0; i < buf.length; i++) {
      view.setUint8(i, buf[i]);
    }
  }
};

module.exports = fills;
