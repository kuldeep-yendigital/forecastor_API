const assert = require('chai').assert;
const component = require('./mapper');
const pkg = require('./../../package.json');
const sams = require('./../sams');

const containsOnly = (arr, values) => {
  return arr.length === arr.filter(
    el => -1 < values.indexOf(el.match(/([a-zA-Z0-9]*)/)[0]
  )).length;
};

const isSortedAsc = (arr) => {
  for (var i = 0; i < arr.length; i++)
    if (arr[i] > arr[i+1]) return false;

  return true;
};

const matchesRegEx = (arr, regEx) => arr.length === arr.filter((el) => el.match(regEx)).length;

const whitelist = [
  'PT0106',
  'PT0107',
  'PT0108',
  'PT0109',
  'PT0110',
  'PT0111',
  'PT0112',
  'PT0113',
  'PT0114',
  'PT0115',
  'PT0116',
  'PT0117',
  'PT0118',
  'PT0119',
  'PT0120',
  'PT0121',
  'PT0122',
  'PT0123',
  'PT0135',
];

describe(`${pkg.name}/auth0/mapper`, () => {
  it('Should expose a function fromSams.', () => {
    assert.isFunction(component.fromSams);
  });

  describe('#fromSams', () => {
    const samsAccount = {
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
    };

    it('Should map a SAMS account to an Auth0 user profile.', () => {
      const user = component.fromSams(samsAccount);

      assert.hasAllKeys(
        user,
        ['user_id', 'email', 'email_verified', 'nickname', 'given_name', 'name', 'family_name', 'password', 'app_metadata', 'user_metadata']
      );

      assert.isDefined(user.app_metadata.company);
      assert.isDefined(user.app_metadata.exportEnabled);
      assert.isDefined(user.app_metadata.salesforceUserId);

      assert.isDefined(user.app_metadata.company);
      assert.isDefined(user.app_metadata.exportEnabled);
      assert.isDefined(user.app_metadata.salesforceUserId);

      assert.isDefined(user.app_metadata.productIds);
      assert.isArray(user.app_metadata.productIds);
      assert.isArray(user.app_metadata.productIds);

      assert.isArray(user.app_metadata.productIds);
      assert.isTrue(isSortedAsc(user.app_metadata.productIds));
      assert.isTrue(matchesRegEx(user.app_metadata.productIds, /([a-zA-Z0-9]*-[a-zA-Z0-9]\1)/));
      assert.isTrue(containsOnly(user.app_metadata.productIds, whitelist));

      assert.isDefined(user.user_metadata.exportEnabled);
    });
  });
});
