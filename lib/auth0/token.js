const cache = new Map();
const configuration = require('./../../config').auth0;
const request = require('request');

module.exports = {

  api: (username, password) => new Promise((resolve, reject) => {
    request.post({
      url     : `https://${configuration.openApi.authDomain}/oauth/token`,
      headers : { 'Content-Type' : 'application/json' },
      json    : {
        audience      : configuration.openApi.audience,
        client_id     : configuration.openApi.authClientId,
        client_secret : configuration.openApi.authClientSecret,
        grant_type    : 'http://auth0.com/oauth/grant-type/password-realm',
        password      : password,
        realm         : configuration.openApi.connection,
        scopes        : 'openid',
        username      : username
      }
    }, (err, response) => {
      if (err)
        return reject(err);

      if (200 !== response.statusCode)
        return reject(response.body);

      return resolve(response.body);
    });
  }),

  management: () => new Promise((resolve, reject) => {
    const key = 'client_credentials';

    // Check in memory cache for client credentials
    if (cache.has(key)) {
      const response = cache.get(key);
      const gracePeriod = 360;
      const expires = response.created + ((response.token.expires_in - gracePeriod) * 1000);
      const now = Date.now();

      if (expires > now)
        return resolve(Object.assign(response.token, {
          expires_in : Math.floor((expires - now) / 1000)
        }));
    }

    request.post({
      url     : `https://${configuration.managementApi.authDomain}/oauth/token`,
      headers : { 'Content-Type' : 'application/json' },
      json    : {
        audience      : `https://${configuration.managementApi.authDomain}/api/v2/`,
        client_id     : configuration.managementApi.authClientId,
        client_secret : configuration.managementApi.authClientSecret,
        grant_type    : 'client_credentials'
      }
    }, (err, response) => {
      if (err)
        return reject(err);

      if (200 !== response.statusCode)
        return reject(response.body);

      cache.set(key, {
        created : Date.now(),
        token   : response.body
      });

      return resolve(response.body);
    });
  })

};
