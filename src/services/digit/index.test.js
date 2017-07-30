const _ = require('lodash');
const names = [
  'Arnica',
  'Mannitol',
  'Eucalyptus',
  'CIPROFLOXACIN',
  'Aspirin',
  'NYSTATIN',
  'Escitalopram',
  'Nitrogen',
  'ropinirole',
  'Perform',
  'Fluoxetine',
  'Nasotuss',
  'Bumetanide',
  'Dextrose'
];

import {
  default as Telmed,
  getDigits
} from './index';

const telmed = Telmed();
names.map(name => telmed.addWord(name));

describe('getDigits', () => {
  it('should get digits from letter', () => {
    expect(getDigits('')).toEqual([]);
    expect(getDigits('a')).toEqual([2]);
    expect(getDigits('b')).toEqual([2]);
    expect(getDigits('C')).toEqual([2]);  
    expect(getDigits('d')).toEqual([3]);
  });

  it('should get digits from word', () => {
    expect(getDigits('aA')).toEqual([2, 2]);
    expect(getDigits('bB')).toEqual([2, 2]);
    expect(getDigits('cC')).toEqual([2, 2]);  
    expect(getDigits('dAAA')).toEqual([3, 2, 2, 2]);
  });
});

describe('addWord', () => {
	it('should add words', () => {
    const words = telmed.search(2);
    console.log(words);
	});
});