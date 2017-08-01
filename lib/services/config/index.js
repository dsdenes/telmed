'use strict';

var _ = require('lodash');

module.exports = function () {
  var config = {};

  return Object.freeze({
    get: function get(path) {
      return _.get(config, path);
    },
    set: function set(path, val) {
      return _.set(config, path, val);
    }
  });
};