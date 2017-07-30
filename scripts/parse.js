#!/usr/bin/env node
const commander = require('commander');
const di = require('../src/services');
const config = di.config;
const parser = di.parser;

commander
  .version('0.1.0')
  .arguments('<dataPath> <cachePath>')
  .action((dataPath, cachePath) => {
    config.set('dataPath', dataPath);
    config.set('cachePath', cachePath);
    parser.start();
  });

commander.parse(process.argv);