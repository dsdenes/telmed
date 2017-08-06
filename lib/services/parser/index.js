'use strict';

var FileWalker = require('filewalker');
var WorkerFarm = require('worker-farm');
var q = require('q');
var path = require('path');
var jsonfile = require('jsonfile');
var fs = require('fs');
var cp = require('child_process');
var ProgressBar = require('progress');

var workers = WorkerFarm(require.resolve('./worker'));

module.exports = function Parser(config, digit) {

  var corpusAppearanceCount = {};
  var wordTfidf = {};
  var documentCount = 0;

  return Object.freeze({
    start: start
  });

  function start() {
    var dataPath = config.get('dataPath');
    var cachePath = config.get('cachePath');
    cp.execSync('mkdir -p ' + cachePath);

    processFiles(dataPath, aggregateCorpusAppearance).then(saveCorpusAppearance(cachePath)).then(function () {
      return processFiles(dataPath, calculateTFIDF);
    }).then(saveTFIDF(cachePath)).then(digit.prepareIndexes).then(onProcessSucceed).catch(onProcessFailed);
  }

  function onProcessSucceed() {
    console.log('All good.');
    WorkerFarm.end(workers);
  }

  function onProcessFailed(error) {
    console.log(error);
    WorkerFarm.end(workers);
    process.exit(1);
  }

  function saveCorpusAppearance(cachePath) {
    return function () {
      jsonfile.writeFileSync(path.join(cachePath, 'corpus_appearance.json'), corpusAppearanceCount);
    };
  }

  function saveTFIDF(cachePath) {
    return function () {
      jsonfile.writeFileSync(path.join(cachePath, 'terms_tf_idf.json'), wordTfidf);
    };
  }

  function processFiles(dataPath, resultAggregator) {
    return new Promise(function (resolve, reject) {

      var totalFileCount = parseInt(cp.execSync('find ' + dataPath + ' -type f -name \'*.txt\' | wc -l').toString());
      var progressBar = initProgressBar(totalFileCount);

      var waitForAllResultHandlers = q.defer();
      var resultHandlerRan = 0;
      var processedFileCount = 0;
      var fileReadDone = false;

      var fileWalker = FileWalker(dataPath, {
        maxPending: 2
      }).on('file', onFile).on('done', onDone);

      fileWalker.walk();

      function throttleRead() {
        if (processedFileCount - resultHandlerRan > 500) {
          fileWalker.pause();
        } else {
          fileWalker.resume();
        }
      }

      function onFile(filename) {
        processedFileCount++;
        throttleRead();
        if (!/\.txt$/.test(filename)) {
          return false;
        }
        var filePath = path.join('./data', filename);
        workers(filePath, handleResult);
      }

      function onDone() {
        fileReadDone = true;
        if (totalFileCount === resultHandlerRan) {
          resolve();
        } else {
          waitForAllResultHandlers.promise.then(resolve);
        }
      }

      function handleResult(err, parseResult) {
        if (err) {
          return reject(err);
        }
        progressBar.tick();
        runResultAggregator(parseResult);
      }

      function runResultAggregator(parseResult) {
        resultAggregator(parseResult);
        resultHandlerRan++;
        throttleRead();
        if (resultHandlerRan === totalFileCount && fileReadDone) {
          waitForAllResultHandlers.resolve();
        }
      }
    });
  }

  function initProgressBar(fileCount) {
    return new ProgressBar(':rate/s :current/:total :bar', { total: fileCount });
  }

  function aggregateCorpusAppearance(parseResult) {
    var termFrequency = parseResult.termFrequency;

    for (var word in termFrequency) {
      if (!corpusAppearanceCount.hasOwnProperty(word)) {
        corpusAppearanceCount[word] = 0;
      }
      corpusAppearanceCount[word] += 1;
      documentCount++;
    }
  }

  function calculateTFIDF(parseResult) {
    var termFrequency = parseResult.termFrequency,
        tokenCount = parseResult.tokenCount;

    for (var word in termFrequency) {
      var frequency = termFrequency[word];
      var documentCountContainsWord = corpusAppearanceCount[word] || 0;

      if (documentCountContainsWord < 3) {
        return false;
      }

      var tfidf = frequency / tokenCount * Math.log(documentCount / (1 + documentCountContainsWord));

      if (!wordTfidf.hasOwnProperty(word) || wordTfidf[word] < tfidf) {
        wordTfidf[word] = tfidf;
      }
    }
  }
};