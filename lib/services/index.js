'use strict';

var Bottle = require('bottlejs');
var di = new Bottle();

var Parser = require('./parser');
var Config = require('./config');

di.service('parser', Parser, 'config');
di.service('config', Config);

module.exports = di.container;