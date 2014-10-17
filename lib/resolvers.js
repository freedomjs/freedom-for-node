/*jslint node:true*/

module.exports = function (resolvers) {
  'use strict';
  resolvers.push({"resolver": function (manifest, url, resolve, reject) {
    var base;
    if (manifest.indexOf('node://') !== 0) {
      reject();
    }

    base = manifest.substr(0, manifest.lastIndexOf("/"));
    if (url.indexOf("/") === 0) {
      resolve("node://" + url);
    } else {
      resolve(base + "/" + url);
    }
  }});

  resolvers.push({"proto": "node", "retriever": function (url, resolve, reject) {
    var filename = url.substr(7);
    // TODO: make sure resolved files are allowable.
    require('fs').readFile(filename, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }});
};
