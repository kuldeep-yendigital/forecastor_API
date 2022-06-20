const account = require('./account');
const assert = require('chai').assert;
const fs = require('fs');
const pkg = require('./../../package.json');

describe(`${pkg.name}/sams/account`, () => {
  const mock = {
    contact       : {
      email      : 'jean-paul.camelbeek@informa.com',
      familyName : 'Camelbeek',
      givenName  : 'Jean-Paul',
      title      : 'Mr.'
    },
    id            : 101408,
    organisation  : 'Jean-Paul Camelbeek',
    parent        : {
      id: 32670
    },
    password      : '639e6edc58458cb03fb6956633040142',
    subscriptions : [
      { id: 46737, isInheritable: false, productId: 'PT0106', type: '1' },
      { id: 46738, isInheritable: false, productId: 'PT0107', type: '1' },
      { id: 46740, isInheritable: false, productId: 'PT0109', type: '1' },
      { id: 46749, isInheritable: false, productId: 'PT0110', type: '1' },
      { id: 46889, isInheritable: false, productId: 'PT0108', type: '2' }
    ],
    type          : 2
  }

  it('Should expose a function create.', () => {
    assert.isFunction(account.create);
  });
  it('Should expose a function fromJson.', () => {
    assert.isFunction(account.fromJson);
  });
  it('Should expose a function fromXml.', () => {
    assert.isFunction(account.fromXml);
  });

  describe('#create', () => {
    const object = require('./example/account_101408.json');

    it('Create an account object from a data structure of type object.', () => {
      assert.deepEqual(account.create(object), mock);
    });
  });

  describe('#fromJson', () => {
    const json = require('./example/account_101408.json');

    it('Create an account object from a data structure of type JSON.', () => {
      assert.deepEqual(account.fromJson(JSON.stringify(json)), mock);
    });
  });

  describe('#fromXml', () => {
    it('Create an account object from a data structure of type XML.', () => {
      const tests = [
        { user : {
          contact       : {
            email      : 'test@test.com',
            familyName : 'Test',
            givenName  : 'Test',
            title      : null
          },
          id            : 104303,
          organisation  : 'ForecasterCo',
          parent        : { id: null },
          password      : '',
          subscriptions : [
            { id: 46762, isInheritable: false, productId: 'PT0106', type: '1' },
            { id: 46763, isInheritable: false, productId: 'PT0107', type: '1' },
            { id: 46765, isInheritable: false, productId: 'PT0108', type: '1' },
            { id: 46767, isInheritable: false, productId: 'PT0109', type: '1' },
            { id: 46768, isInheritable: false, productId: 'PT0110', type: '1' },
            { id: 46769, isInheritable: false, productId: 'PT0111', type: '1' },
            { id: 46770, isInheritable: false, productId: 'PT0112', type: '1' },
            { id: 46771, isInheritable: false, productId: 'PT0113', type: '1' },
            { id: 46772, isInheritable: false, productId: 'PT0114', type: '1' },
            { id: 46773, isInheritable: false, productId: 'PT0115', type: '1' },
            { id: 46774, isInheritable: false, productId: 'PT0116', type: '1' },
            { id: 46775, isInheritable: false, productId: 'PT0117', type: '1' },
            { id: 46776, isInheritable: false, productId: 'PT0118', type: '1' },
            { id: 46778, isInheritable: false, productId: 'PT0119', type: '1' },
            { id: 46779, isInheritable: false, productId: 'PT0120', type: '1' },
            { id: 46780, isInheritable: false, productId: 'PT0121', type: '1' },
            { id: 46781, isInheritable: false, productId: 'PT0122', type: '1' },
            { id: 46782, isInheritable: false, productId: 'PT0123', type: '1' }
          ],
          type          : 9
        } , xml : fs.readFileSync(`${__dirname}/example/account_104303.xml`, 'utf8') },
        { user : {
          contact       : {
            email      : 'WTVIS@forecaster.com',
            familyName : 'Forecaster',
            givenName  : 'WTVIS',
            title      : null },
          id            : 104309,
          organisation  : 'WTVIS Forecaster',
          parent        : { id: 104303 },
          password      : 'ce375db07573d6380c4b40e62f69176a',
          subscriptions : [
            { id: 46767, isInheritable: false, productId: 'PT0109', type: '1' }
          ],
          type          : 2
        }, xml : fs.readFileSync(`${__dirname}/example/account_104309.xml`, 'utf8') },
        { user : mock, xml : fs.readFileSync(`${__dirname}/example/account_101408.xml`, 'utf8') }
      ];

      tests.forEach((test) => {
        assert.deepEqual(account.fromXml(test.xml), test.user);
      });
    });
  });

});
