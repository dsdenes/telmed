const FileWalker = require('filewalker');
const WorkerFarm = require('worker-farm');
const q = require('q');
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const cp = require('child_process');
const ProgressBar = require('progress');

const workers = WorkerFarm(require.resolve('./worker'));

module.exports = function Parser(config, digit) {

  const corpusAppearanceCount = {};
  const wordTfidf = {};
  let documentCount = 0;

  return Object.freeze({
    start
  });

  function start() {
    const dataPath = config.get('dataPath');
    const cachePath = config.get('cachePath');
    cp.execSync(`mkdir -p ${cachePath}`);

    processFiles(dataPath, aggregateCorpusAppearance)
      .then(saveCorpusAppearance(cachePath))
      .then(() => processFiles(dataPath, calculateTFIDF))
      .then(saveTFIDF(cachePath))
      .then(digit.prepareIndexes)
      .then(onProcessSucceed)
      .catch(onProcessFailed);
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
    return () => {
      jsonfile.writeFileSync(path.join(cachePath, 'corpus_appearance.json'), corpusAppearanceCount);
    }
  }

  function saveTFIDF(cachePath) {
    return () => {
      jsonfile.writeFileSync(path.join(cachePath, 'terms_tf_idf.json'), wordTfidf);
    }
  }

  function processFiles(dataPath, resultAggregator) {
    return new Promise((resolve, reject) => {

      const totalFileCount = parseInt(cp.execSync(`ls ${path.join(dataPath, '*.txt')} | wc -l`).toString());
      const progressBar = initProgressBar(totalFileCount);

      const waitForAllResultHandlers = q.defer();
      let resultHandlerRan = 0;
      let processedFileCount = 0;
      let fileReadDone = false;

      const fileWalker = FileWalker(dataPath, {
        maxPending: 2
      }).on('file', onFile)
        .on('done', onDone);

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
        const filePath = path.join('./data', filename);
        workers(filePath, handleResult);
      }

      function onDone() {
        fileReadDone = true;
        if (totalFileCount === resultHandlerRan) {
          resolve();
        } else {
          waitForAllResultHandlers.promise
            .then(resolve);
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
    const { termFrequency } = parseResult;
    for (let word in termFrequency) {
      if (!corpusAppearanceCount.hasOwnProperty(word)) {
        corpusAppearanceCount[word] = 0;
      }
      corpusAppearanceCount[word] += 1;
      documentCount++;
    }
  }

  function calculateTFIDF(parseResult) {
    const { termFrequency, tokenCount } = parseResult;
    for (let word in termFrequency) {
      const frequency = termFrequency[word];
      const documentCountContainsWord = corpusAppearanceCount[word] || 0;

      if (documentCountContainsWord < 3) {
        return false;
      }

      const tfidf = frequency / tokenCount * Math.log(documentCount / (1 + documentCountContainsWord));

      if (!wordTfidf.hasOwnProperty(word) || wordTfidf[word] < tfidf) {
        wordTfidf[word] = tfidf;
      }
    }
  }
};