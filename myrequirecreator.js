/*
 * This module overcomes the NodeJS's bug with require
 * The bug is:
 * 1. require a module that doesn't exist
 * 2. require fails
 * 3. obtain a module that didn't exist
 * 4. require will fail if "main" of the obtained module's package.json is not "index.js"
 */
var Path = require('path'),
  fs = require('fs');
function createMyRequire (execlib) {
  'use strict';

  function mytryer (name, result, path) {
    var pj;
    if (result) {
      return result;
    }
    try {
      pj = JSON.parse(fs.readFileSync(Path.join(path, name, 'package.json')));
      if (pj && pj.main) {
        return require(Path.join(path, name, pj.main));
      }
      return result;
    } catch (e) {
      return result;
    }
  }
  function myrequire (name) {
    var ret ;
    try {
      return require(name);
    } catch (e) {
      ret = require.resolve.paths(name).reduce(mytryer.bind(null, name), null);
      if (ret !== null) {
        return ret;
      }
      throw e;
    }
  }

  return myrequire;
}
module.exports = createMyRequire;
