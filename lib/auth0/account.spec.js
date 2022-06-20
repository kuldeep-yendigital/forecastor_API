const assert = require('chai').assert;
const component = require('./account');
const pkg = require('./../../package.json');

describe(`${pkg.name}/auth0/account`, () => {
  it('Should expose a function exists.', () => {
    assert.isFunction(component.exists);
  });
  it('Should expose a function getUserId.', () => {
    assert.isFunction(component.getUserId);
  });
  it('Should expose a function upsert.', () => {
    assert.isFunction(component.upsert);
  });

  describe('#getUserId', () => {
    const auth = {
      account : {
        company       : 'Ovum Internal',
        salesforceUserId : 104217,
        canFlushRedis : false
      },
      subscriptions : [
        { value: 'PT0109-1', dataset: 'PT0109', trial: false },
        { value: 'PT0110-1', dataset: 'PT0110', trial: false }
      ]
    };

    it('Should accept an auth object and return the user id', () => {
      assert.equal(component.getUserId(auth), auth.account.salesforceUserId);
    });

    it('Should accept an auth object and return null if user id does not exist', () => {
      assert.isNull(component.getUserId(undefined));
      assert.isNull(component.getUserId({}));
      assert.isNull(component.getUserId({ account : {} }));
    });
  });

  describe('#getSubscriptions', () => {
    const auth = {
      account : {
        company       : 'Ovum Internal',
        salesforceUserId : 104217,
        canFlushRedis : false
      },
      subscriptions : [
        { value: 'PT0109-1', dataset: 'PT0109', trial: false },
        { value: 'PT0110-1', dataset: 'PT0110', trial: false }
      ]
    };

    it('Should accept an auth object and return an array of subscriptions', () => {
      assert.equal(component.getSubscriptions(auth), auth.subscriptions);
    });

    it('Should accept an auth object and return an empty array if user does not have any subscription', () => {
      assert.isTrue(component.getSubscriptions({ account : auth.account }).length === 0);
      assert.isTrue(component.getSubscriptions({ account : {}, subscriptions : [] }).length === 0);
    });
  });
});
