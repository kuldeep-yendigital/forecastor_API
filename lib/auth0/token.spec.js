const assert = require('chai').assert;
const component = require('./token');
const pkg = require('./../../package.json');

describe(`${pkg.name}/auth0/token`, () => {
  it('Should expose a function api.', () => {
    assert.isFunction(component.api);
  });
  it('Should expose a function management.', () => {
    assert.isFunction(component.management);
  });
});
