const fs = require('fs');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const _ = require('lodash');
const stopWords = require('./stopwords_en.json');

module.exports = function(filePath, callb) {
  try {
    const content = fs.readFileSync(filePath).toString();
    const tokens = tokenizer.tokenize(content).map(token => token.toLowerCase());

    const importantTokens = _.difference(tokens, stopWords);

    const result = {
      tokenCount: tokens.length,
      termFrequency: _.countBy(importantTokens),
    };

    callb(null, result);
  } catch(err) {
    callb(err);
  }
};