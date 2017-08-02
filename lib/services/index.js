'use strict';

var Bottle = require('bottlejs');
var di = new Bottle();

var Parser = require('./parser');
var Digit = require('./digit');
var Config = require('./config');

di.service('parser', Parser, 'config', 'digit');
di.service('digit', Digit, 'config');
di.service('config', Config);

module.exports = di.container;