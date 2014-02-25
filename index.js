/*jslint indent:2,white:true,sloppy:true,node:true */
/*
 * freedom.js Node runtime
 */

'use strict';

global.Promise = require('es6-promise').Promise;

var sources = [
  '/node_modules/freedom/src',
  '/providers/',
  '/node_modules/freedom/src/proxy',
  '/node_modules/freedom/interface'
];

sources.forEach(function(dir) {
  require('fs').readdirSync(__dirname + dir).forEach(function(file) {
    if (file.match(/.+\.js/) !== null) {
      require(__dirname + dir + '/' + file);
    }
  });
});

fdom.resources.addResolver(function(manifest, url, resolve) {
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
});

fdom.resources.addRetriever('node', function(url, resolve, reject) {
  var filename = url.substr(7);
  require('fs').readFile(filename, function(err, data) {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  });
});

module.exports.freedom = function(fdom, manifest) {
  return fdom.setup(global, undefined, {
    portType: 'Node',
    isApp: false,
    stayLocal: true,
    location: "node://",
    manifest: manifest
  });
}.bind(global, fdom);

if (!module.parent) {
  global.importScripts = function(script) {
    console.warn('importing...' + script);
    require(script.substr(7));
  };

  global.freedom = fdom.setup(global, undefined, {
    portType: 'Node',
    isApp: true,
    stayLocal: true,
    location: "node://"
  });
}