const assert = require('chai').assert;
const component = require('./user');
const pkg = require('./../../package.json');

describe(`${pkg.name}/sams/user`, () => {
  it('Should expose a function get.', () => {
    assert.isFunction(component.get);
  });
});
