'use strict';

var fs = require('fs');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var _ = require('lodash');
var stopWords = require('../src/services/parser/stopwords_en.json');

module.exports = function (filePath, callb) {
  try {
    var content = fs.readFileSync(filePath).toString();
    var tokens = tokenizer.tokenize(content);
    // const stemmedTokens = tokens.map(natural.LancasterStemmer.stem);
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