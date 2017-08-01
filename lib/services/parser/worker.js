'use strict';

var fs = require('fs');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var _ = require('lodash');
var stopWords = require('./stopwords_en.json');

module.exports = function (filePath, callb) {
  try {
    var content = fs.readFileSync(filePath).toString();
    var tokens = tokenizer.tokenize(content).map(function (token) {
      return token.toLowerCase();
    });

    var importantTokens = _.difference(tokens, stopWords);

    var result = {
      tokenCount: tokens.length,
      termFrequency: _.countBy(importantTokens)
    };

    callb(null, result);
  } catch (err) {
    callb(err);
  }
};