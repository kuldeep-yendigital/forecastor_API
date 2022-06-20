const configuration = require('./../../config').auth0.managementApi;
const request = require('request');
const token = require('./token');

module.exports = {

  exists: (userId) => new Promise((resolve, reject) => {
    return token.management().then(token => {
      request.head({
        url     : `https://${configuration.authDomain}/api/v2/users/auth0%7C${userId}`,
        headers : { 'Authorization': `Bearer ${token.access_token}` }
      }, (err, response) => {
        if (err) return reject(err);
        return resolve(200 === response.statusCode);
      });
    });
  }),

  get: (userId) => new Promise((resolve, reject) => {
    return token.management().then(token => {
      request.get({
        url     : `https://${configuration.authDomain}/api/v2/users/auth0%7C${userId}`,
        headers : { 'Authorization': `Bearer ${token.access_token}` }
      }, (err, response) => {
        if (err) return reject(err);

        if (404 === response.statusCode) return resolve(undefined);
        if (200 === response.statusCode) return resolve(JSON.parse(response.body));

        return reject(response);
      });
    });
  }),

  getUserId: (auth) => {
    return auth && auth.account && (auth.account.salesforceUserId || auth.account.samsAccountId)
      ? (auth.account.salesforceUserId || auth.account.samsAccountId)
      : null;
  },

  getSubscriptions: (auth) => {
    return auth && Array.isArray(auth.subscriptions)
      ? auth.subscriptions
      : [];
  },

  upsert: (id, data) => {
    let user = undefined;

    return module.exports.get(id)
      .then(res => (user = res))
      .then(() => token.management())
      .then(token => new Promise((resolve, reject) => {
        const params = {
          headers    : {
            'Authorization' : `Bearer ${token.access_token}`,
            'Content-Type'  : 'application/json'
          },
          json       : undefined,
          url        : undefined,
          method     : undefined
        };

        if (user) {
          const ignoredKeys = [
            'created_at',
            'email',
            'email_verified',
            'family_name',
            'given_name',
            'identities',
            'last_ip',
            'last_login',
            'logins_count',
            'name',
            'nickname',
            'picture',
            'updated_at',
            'user_id'
          ];

          const identity = user.identities.find(identity => id === identity.user_id && 'auth0' === identity.provider);

          params.json = Object.assign({
            connection    : identity.connection,
            client_id     : configuration.authClientId
          }, Object.keys(data).reduce((acc, key) => {
            if (-1 < ignoredKeys.indexOf(key)) return acc;
            return Object.assign({[key]: data[key]}, acc);
          }, {}));

          params.url = `https://${configuration.authDomain}/api/v2/users/auth0%7C${id}`;
          params.method = 'PATCH';
        } else {
          params.json = Object.assign({
            connection    : configuration.connection
          }, data);
          params.url = `https://${configuration.authDomain}/api/v2/users`;
          params.method = 'POST';
        }

        request(params, (err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
      })
    );
  }

};
