#!/usr/bin/env node
const commander = require('commander');
const di = require('../src/services');
const config = di.config;
const digit = di.digit;

commander
  .version('0.1.0')
  .arguments('<cachePath> [phoneNumbers...]')
  .action((cachePath, phoneNumbers) => {

    config.set('cachePath', cachePath);

    phoneNumbers.map(phoneNumber => {
      const mnemonics = digit.search(phoneNumber);
      const mnemonicsOutput = [];
      if (mnemonics.length) {
        mnemonics.sort((a, b) => {
          if (a[1] === b[1]) {
            return 0;
          } else {
            return a[1] < b[1] ? 1 : -1;
          }
        });
        mnemonics.map(mnemonic => {
          mnemonicsOutput.push(`${mnemonic[0]} (${mnemonic[1]})`);
        });
      }
      console.log(`${phoneNumber}: ${mnemonicsOutput.join(', ')}`);
    });
  });

commander.parse(process.argv);