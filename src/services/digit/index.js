import TreeModel from 'tree-model';
import removeAccents from 'remove-accents';
const treeModel = new TreeModel();
const _ = require('lodash');
const digitsMap = require('./digits.json');
const util = require('util');
const CircularJSON = require('circular-json');

export default () => {

  const tree = treeModel.parse({});
  const words = {};

	return Object.freeze({
    addWord,
    search
  });

  function search(digitsId) {
    console.log(JSON.stringify(tree.model));
    const parentNode = tree.first(hasId(digitsId));
    if (parentNode === undefined) {
      return [];
    }
    let resultWords = [];
    parentNode.walk(node => {
      if (words.hasOwnProperty(node.model.id)) {
        // resultWords.push(words[node.model.id]);
      } 
    });
    return _.flatten(resultWords);
  }

  function addWord(word) {
    const digits = getDigits(word);
    const digitsId = parseInt(digits.join(''));

    if (!words.hasOwnProperty(digitsId)) {
      assertNode(treeModel.parse({ id: digitsId }));
      words[digitsId] = true;
    }
  } 

  function assertNode(childNode) {
    if (typeof tree.first(hasId(childNode.model.id)) === 'undefined') {
      const parentId = getParentId(childNode.model.id);
      if (parentId !== 0) {
        const parentNode = tree.first(hasId(parentId)); 
        if (typeof parentNode !== 'undefined') {
          parentNode.addChild(childNode);
        } else {
          const newParentNode = treeModel.parse({ id: parentId });
          newParentNode.addChild(childNode);
          assertNode(newParentNode);          
        }
      } else {
        tree.addChild(childNode);
      }
    }
  }

  function hasId(id) {
    return node => node.model.id === id;
  }

  function getParentId(childId) {
    return parseInt(childId / 10);
  }

}

export function getDigits(word) {
  const normalizedWord = convertToASCII(word);
  return Array.from(normalizedWord).map(char => digitsMap[char]);
}

export function convertToASCII(word) {
  return removeAccents(word).toLowerCase();
}