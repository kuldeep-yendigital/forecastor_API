const assert = require('chai').assert;
const component = require('./index');
const pkg = require('./../../package.json');

describe(`${pkg.name}/util`, () => {
  it('Should expose a function isMd5.', () => {
    assert.isFunction(component.isMd5);
  });
  it('Should expose a function md5.', () => {
    assert.isFunction(component.md5);
  });

  describe('#isMd5', () => {
    it('Should check if a given string is a valid MD5 hash according to rfc1321.', () => {
      const examples = [
        { value: 'password', assert: false },
        { value: '*******************************', assert: false },
        { value: '2fe50bab998e26b422b0f8b55840cdca', assert: true }
      ];

      examples.forEach(example => {
        assert.equal(component.isMd5(example.value), example.assert)
      })
    });
  });

  describe('#md5', () => {
    it('Should hash a given string using MD5.', () => {
      const examples = [
        { value: '!@£$%^&*èį()_+', assert: '84122f779d43af5e2b7d035742763a25' },
        { value: '*******************************', assert: '0108754529c1b4f32d758a765fc4a8d9' }
      ];

      examples.forEach(example => {
        assert.equal(component.md5(example.value), example.assert)
      })
    });
  });
});
