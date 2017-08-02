'use strict';

var removeAccents = require('remove-accents');
var digitsMap = require('./digits.json');
var util = require('util');
var path = require('path');
var jsonfile = require('jsonfile');
var fs = require('fs');
var cp = require('child_process');
var ProgressBar = require('progress');

module.exports = function (config) {

  var digitsToWords = {};
  var cacheFilesLoaded = {};

  return Object.freeze({
    addWord: addWord,
    prepareIndexes: prepareIndexes,
    search: search
  });

  function prepareIndexes() {

    var cachePath = getCachePath();
    var digitsCachePath = getDigitsCachePath();

    var digitsCache = {};
    var wordWithTFIDF = jsonfile.readFileSync(path.join(cachePath, 'terms_tf_idf.json'));

    for (var word in wordWithTFIDF) {
      var frequency = wordWithTFIDF[word];
      addWord(word, frequency);
    }

    for (var digit in digitsToWords) {
      if (digit.length > 12 || digit.length < 3) {
        continue;
      }

      var firstThreeDigits = digit.slice(0, 3);
      if (!digitsCache.hasOwnProperty(firstThreeDigits)) {
        digitsCache[firstThreeDigits] = {};
      }
      digitsCache[firstThreeDigits][digit] = digitsToWords[digit];
    }

    for (var _firstThreeDigits in digitsCache) {
      var firstThreeDigitsCachePath = path.join(digitsCachePath, _firstThreeDigits + '.json');
      jsonfile.writeFileSync(firstThreeDigitsCachePath, digitsCache[_firstThreeDigits]);
    }
  }

  function search(digitsId) {
    var digitsCachePath = getDigitsCachePath();

    var firstThreeDigits = digitsId.slice(0, 3);
    if (!cacheFilesLoaded.hasOwnProperty(firstThreeDigits)) {
      var firstThreeDigitsCachePath = path.join(digitsCachePath, firstThreeDigits + '.json');
      if (fs.existsSync(firstThreeDigitsCachePath)) {
        Object.assign(digitsToWords, jsonfile.readFileSync(firstThreeDigitsCachePath));
      }
    }

    if (!digitsToWords.hasOwnProperty(digitsId)) {
      return false;
    } else {
      return digitsToWords[digitsId];
    }
  }

  function addWord(word, frequency) {
    var digits = getDigits(word);
    var digitsId = digits.join('');

    if (!digitsToWords.hasOwnProperty(digitsId)) {
      digitsToWords[digitsId] = [];
    }

    digitsToWords[digitsId].push([word, frequency]);
  }

  function getCachePath() {
    var cachePath = path.join(process.cwd(), config.get('cachePath'));
    cp.execSync('mkdir -p ' + cachePath);
    return cachePath;
  }

  function getDigitsCachePath() {
    var digitsCachePath = path.join(process.cwd(), config.get('cachePath'), 'digits');
    cp.execSync('mkdir -p ' + digitsCachePath);
    return digitsCachePath;
  }
};

function getDigits(word) {
  var normalizedWord = convertToASCII(word);
  return Array.from(normalizedWord).map(function (char) {
    return digitsMap[char];
  });
}

function convertToASCII(word) {
  return removeAccents(word).toLowerCase();
}