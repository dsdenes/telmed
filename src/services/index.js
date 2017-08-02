const Bottle = require('bottlejs');
const di = new Bottle();

const Parser = require('./parser');
const Digit = require('./digit');
const Config = require('./config');

di.service('parser', Parser, 'config', 'digit');
di.service('digit', Digit, 'config');
di.service('config', Config);

module.exports = di.container;