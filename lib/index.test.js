'use strict';

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var names = ['Arnica', 'Mannitol', 'Eucalyptus', 'CIPROFLOXACIN', 'Aspirin', 'NYSTATIN', 'Escitalopram', 'Nitrogen', 'ropinirole', 'Perform', 'Fluoxetine', 'Nasotuss', 'Bumetanide', 'Dextrose'];

var telmed = (0, _index2.default)();
names.map(function (name) {
  return telmed.addWord(name);
});

describe('getDigits', function () {
  it('should get digits from letter', function () {
    expect((0, _index.getDigits)('')).toEqual([]);
    expect((0, _index.getDigits)('a')).toEqual([2]);
    expect((0, _index.getDigits)('b')).toEqual([2]);
    expect((0, _index.getDigits)('C')).toEqual([2]);
    expect((0, _index.getDigits)('d')).toEqual([3]);
  });

  it('should get digits from word', function () {
    expect((0, _index.getDigits)('aA')).toEqual([2, 2]);
    expect((0, _index.getDigits)('bB')).toEqual([2, 2]);
    expect((0, _index.getDigits)('cC')).toEqual([2, 2]);
    expect((0, _index.getDigits)('dAAA')).toEqual([3, 2, 2, 2]);
  });
});

describe('addWord', function () {
  it('should add words', function () {
    var words = telmed.search(2);
    console.log(words);
  });
});