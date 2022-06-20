const configuration = require('./../../config').auth0.managementApi;
const { md5 } = require('./../util');

const createUserId = (id) => md5(configuration.connection + id);
const sortAsc = (arr) => arr.sort((a, b) => {
  if(a < b) return -1;
  if(a > b) return 1;
  return 0;
});

module.exports = {

  /**
   * Maps a SAMS account to an Auth0 user profile (c.f. https://auth0.com/docs/user-profile/normalized/auth0)
   * @param  {Object} data
   * @return {Object}
   */
  fromSams : (data) => {
    const productIds = sortAsc(
      data.subscriptions.map(subscription => `${subscription.productId}-${subscription.type}`)
    );

    return {
      user_id        : createUserId(data.id),
      email          : data.contact.email,
      email_verified : false,
      name           : data.contact.email,
      nickname       : data.contact.givenName,
      given_name     : data.contact.givenName,
      family_name    : data.contact.familyName,
      password       : data.password,
      app_metadata   : {
        exportEnabled : true,
        company       : data.organisation,
        productIds    : productIds.filter((productId, pos) => productIds.indexOf(productId) === pos),
        salesforceUserId : data.id,
        samsParentId: data.parent.id
      },
      user_metadata  : {
        // @TODO Should be moved to app_metadata once the ui has been updated accordingly
        exportEnabled : true
      }
    };
  }
};
