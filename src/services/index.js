const Bottle = require('bottlejs');
const di = new Bottle();

const Parser = require('./parser');
const Config = require('./config');

di.service('parser', Parser, 'config');
di.service('config', Config);

module.exports = di.container;