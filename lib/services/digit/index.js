'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDigits = getDigits;
exports.convertToASCII = convertToASCII;

var _treeModel = require('tree-model');

var _treeModel2 = _interopRequireDefault(_treeModel);

var _removeAccents = require('remove-accents');

var _removeAccents2 = _interopRequireDefault(_removeAccents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var treeModel = new _treeModel2.default();
var _ = require('lodash');
var digitsMap = require('./digits.json');
var util = require('util');
var CircularJSON = require('circular-json');

exports.default = function () {

  var tree = treeModel.parse({});
  var words = {};

  return Object.freeze({
    addWord: addWord,
    search: search
  });

  function search(digitsId) {
    console.log(JSON.stringify(tree.model));
    var parentNode = tree.first(hasId(digitsId));
    if (parentNode === undefined) {
      return [];
    }
    var resultWords = [];
    parentNode.walk(function (node) {
      if (words.hasOwnProperty(node.model.id)) {
        // resultWords.push(words[node.model.id]);
      }
    });
    return _.flatten(resultWords);
  }

  function addWord(word) {
    var digits = getDigits(word);
    var digitsId = parseInt(digits.join(''));

    if (!words.hasOwnProperty(digitsId)) {
      assertNode(treeModel.parse({ id: digitsId }));
      words[digitsId] = true;
    }
  }

  function assertNode(childNode) {
    if (typeof tree.first(hasId(childNode.model.id)) === 'undefined') {
      var parentId = getParentId(childNode.model.id);
      if (parentId !== 0) {
        var parentNode = tree.first(hasId(parentId));
        if (typeof parentNode !== 'undefined') {
          parentNode.addChild(childNode);
        } else {
          var newParentNode = treeModel.parse({ id: parentId });
          newParentNode.addChild(childNode);
          assertNode(newParentNode);
        }
      } else {
        tree.addChild(childNode);
      }
    }
  }

  function hasId(id) {
    return function (node) {
      return node.model.id === id;
    };
  }

  function getParentId(childId) {
    return parseInt(childId / 10);
  }
};

function getDigits(word) {
  var normalizedWord = convertToASCII(word);
  return Array.from(normalizedWord).map(function (char) {
    return digitsMap[char];
  });
}

function convertToASCII(word) {
  return (0, _removeAccents2.default)(word).toLowerCase();
}