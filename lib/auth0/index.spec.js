const assert = require('chai').assert;
const component = require('./index');
const pkg = require('./../../package.json');

describe(`${pkg.name}/auth0/index`, () => {
  it('Should expose an object api.', () => {
    assert.isObject(component.api);
    assert.isObject(component.api.account);
    assert.isObject(component.api.token);
  });
  it('Should expose an object mapper.', () => {
    assert.isObject(component.mapper);
  });
});
