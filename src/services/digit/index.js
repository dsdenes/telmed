const removeAccents = require('remove-accents');
const digitsMap = require('./digits.json');
const util = require('util');
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const cp = require('child_process');
const ProgressBar = require('progress');

module.exports = function(config) {

  const digitsToWords = {};
  const cacheFilesLoaded = {};

	return Object.freeze({
    addWord,
    prepareIndexes,
    search
  });

	function prepareIndexes() {

	  const cachePath = getCachePath();
    const digitsCachePath = getDigitsCachePath();

    const digitsCache = {};
    const wordWithTFIDF = jsonfile.readFileSync(path.join(cachePath, 'terms_tf_idf.json'));

    for (let word in wordWithTFIDF) {
      const frequency = wordWithTFIDF[word];
      addWord(word, frequency);
    }

    for (let digit in digitsToWords) {
      if (digit.length > 12 || digit.length < 3) {
        continue;
      }

      const firstThreeDigits = digit.slice(0, 3);
      if (!digitsCache.hasOwnProperty(firstThreeDigits)) {
        digitsCache[firstThreeDigits] = {};
      }
      digitsCache[firstThreeDigits][digit] = digitsToWords[digit];
    }

    for (let firstThreeDigits in digitsCache) {
      const firstThreeDigitsCachePath = path.join(digitsCachePath, `${firstThreeDigits}.json`);
      jsonfile.writeFileSync(firstThreeDigitsCachePath, digitsCache[firstThreeDigits]);
    }
  }

  function search(digitsId) {
    const digitsCachePath = getDigitsCachePath();

    const firstThreeDigits = digitsId.slice(0, 3);
	  if (!cacheFilesLoaded.hasOwnProperty(firstThreeDigits)) {
      const firstThreeDigitsCachePath = path.join(digitsCachePath, `${firstThreeDigits}.json`);
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
    const digits = getDigits(word);
    const digitsId = digits.join('');

    if (!digitsToWords.hasOwnProperty(digitsId)) {
      digitsToWords[digitsId] = [];
    }

    digitsToWords[digitsId].push([
      word,
      frequency
    ]);
  }

  function getCachePath() {
    const cachePath = path.join(process.cwd(), config.get('cachePath'));
    cp.execSync(`mkdir -p ${cachePath}`);
    return cachePath;
  }

  function getDigitsCachePath() {
    const digitsCachePath = path.join(process.cwd(), config.get('cachePath'), 'digits');
    cp.execSync(`mkdir -p ${digitsCachePath}`);
    return digitsCachePath;
  }

};

function getDigits(word) {
  const normalizedWord = convertToASCII(word);
  return Array.from(normalizedWord).map(char => digitsMap[char]);
}

function convertToASCII(word) {
  return removeAccents(word).toLowerCase();
}