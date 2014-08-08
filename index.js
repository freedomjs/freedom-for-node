/*jslint indent:2,white:true,sloppy:true,node:true */
/*
 * freedom.js Node runtime
 */

'use strict';

if (!module.parent) {
  require(__dirname + '/lib/modulecontext');
  return;
}

global.Promise = require('es6-promise').Promise;

var fileInfo = require('freedom'),
    glob = require('glob'),
    freedomPrefix = require.resolve('freedom').substr(0,
        require.resolve('freedom').lastIndexOf('freedom') + 8);

fileInfo.FILES.srcCore.concat(
    fileInfo.FILES.srcPlatform).forEach(function(dir) {
  glob.sync(freedomPrefix + '/' +  dir).forEach(function(file) {
    require(file);
  });
});
glob.sync(__dirname + '/providers/*.js').forEach(function(file) {
  require(file);
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

module.exports.freedom = function(fdom, manifest, options, freedomcfg) {
  if (typeof freedomcfg !== 'undefined') { freedomcfg(fdom.apis.register.bind(fdom.apis)); }
  return fdom.setup(global, undefined, fdom.util.mixin({
    portType: 'Node',
    isModule: false,
    stayLocal: true,
    location: "node://" + module.parent.filename,
    manifest: manifest
  }, options));
}.bind(global, fdom);
