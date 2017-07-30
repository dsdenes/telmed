const _ = require('lodash');

module.exports = function () {
  const config = {};

  return Object.freeze({
    get: path => _.get(config, path),
    set: (path, val) => _.set(config, path, val)
  });
};