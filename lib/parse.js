'use strict';

var _filewalker = require('filewalker');

var _filewalker2 = _interopRequireDefault(_filewalker);

var _workerFarm = require('worker-farm');

var _workerFarm2 = _interopRequireDefault(_workerFarm);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var workers = (0, _workerFarm2.default)(require.resolve('./worker'));
var processFiles = cachedFileProcessor();

var corpusContains = {};
var wordTfidf = {};
var documentCount = 0;

processFiles(aggregateDocumentContainsWord).then(function () {
  return processFiles(calculateTFIDF);
}).then(onProcessSucceed).catch(onProcessFailed);

function onProcessSucceed() {
  _jsonfile2.default.writeFileSync('wordtfidf.json', wordTfidf);
  console.log('All good.');
  _workerFarm2.default.end(workers);
}

function onProcessFailed(error) {
  console.log(error);
  _workerFarm2.default.end(workers);
  process.exit(1);
}

function cachedFileProcessor() {
  var cache = {};

  return function (resultAggregator) {

    return new Promise(function (resolve, reject) {

      var waitForAllResultHandlers = _q2.default.defer();
      var fileCount = 0;
      var resultHandlerRan = 0;
      var fileReadDone = false;

      var fileWalker = (0, _filewalker2.default)('./data').on('file', onFile).on('pause', onPause).on('resume', onResume).on('done', onDone);

      fileWalker.walk();

      function throttleRead() {
        if (fileCount - resultHandlerRan > 10) {
          fileWalker.pause();
        } else {
          fileWalker.resume();
        }
      }

      function onPause() {
        console.log('pause');
      }

      function onResume() {
        console.log('resume');
      }

      function onFile(filename) {
        fileCount++;
        throttleRead();

        if (hasCache(filename)) {
          runResultAggregator(cache[filename]);
        } else {
          var filePath = _path2.default.join('data', filename);
          workers(filePath, handleResult(filename));
        }
      }

      function onDone() {
        fileReadDone = true;
        if (fileCount === resultHandlerRan) {
          resolve();
        } else {
          waitForAllResultHandlers.promise.then(resolve);
        }
      }

      function handleResult(filename) {
        return function (err, parseResult) {
          if (err) {
            return reject(err);
          }
          saveToCache(filename, parseResult);
          runResultAggregator(parseResult);
        };
      }

      function runResultAggregator(parseResult) {
        resultAggregator(parseResult);
        resultHandlerRan++;
        throttleRead();
        if (resultHandlerRan === fileCount && fileReadDone) {
          waitForAllResultHandlers.resolve();
        }
      }
    });

    function saveToCache(filename, parseResult) {
      cache[filename] = parseResult;
    }

    function hasCache(filename) {
      return cache.hasOwnProperty(filename);
    }
  };
}

var i = 0;
function aggregateDocumentContainsWord(parseResult) {
  var termFrequency = parseResult.termFrequency;

  for (var word in termFrequency) {
    corpusContains[word] = corpusContains[word] || 0;
    corpusContains[word] += 1;
    documentCount++;
  }
}

function calculateTFIDF(parseResult) {
  var termFrequency = parseResult.termFrequency,
      tokenCount = parseResult.tokenCount;

  for (var word in termFrequency) {
    var frequency = termFrequency[word];
    var documentCountContainsWord = corpusContains[word] || 0;
    var tfidf = frequency / tokenCount * Math.log(documentCount / (1 + documentCountContainsWord));

    if (!wordTfidf.hasOwnProperty(word) || wordTfidf[word] < tfidf) {
      wordTfidf[word] = tfidf;
    }
  }
}