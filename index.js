/*jslint indent:2,white:true,sloppy:true,node:true */
/*
 * freedom.js Node runtime
 */

'use strict';
var resolvers = [],
  providers = [
    require('freedom/providers/core/core.unprivileged'),
    require('freedom/providers/core/echo.unprivileged'),
    require('freedom/providers/core/logger.console'),
    require('freedom/providers/core/peerconnection.unprivileged'),
    require('freedom/providers/core/websocket.unprivileged'),
    require('./providers/storage'),
    require('./providers/tcpsocket'),
    require('./providers/udpsocket')
  ],
  oauth = require('freedom/providers/core/oauth');

providers.push(oauth);

if (!module.parent) {
  require(__dirname + '/lib/modulecontext');
} else {
  global.Promise = require('es6-promise').Promise;

  resolvers.push({"resolver": function(manifest, url, resolve) {
    var base;
    if (manifest.indexOf('node://') !== 0) {
      return false;
    }

    base = manifest.substr(0, manifest.lastIndexOf("/"));
    if (url.indexOf("/") === 0) {
      resolve("node://" + url);
    } else {
      resolve(base + "/" + url);
    }
    return true;
  }});

  resolvers.push({"proto": "node", "retriever": function(url, resolve, reject) {
    var filename = url.substr(7);
    // TODO: make sure resolved files are allowable.
    require('fs').readFile(filename, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }});

  module.exports.freedom = require('freedom/src/entry').bind({}, {
    location: "node://" + module.parent.filename,
    portType: require('./providers/link'),
    providers: providers,
    resolvers: resolvers,
    isModule: false
  });
}
