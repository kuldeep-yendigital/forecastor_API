const host = require('./../../config').sams.host;
const env = require('./../../config').env;
const request = require('request');
const AccountFactory = require('./account');
const certificate = require('fs').readFileSync(`${__dirname}/./../../cert/sams_${env}.pem`, 'utf8');    

const getAccount = (id) => new Promise((resolve, reject) => {
  const params = {
    url          : `${host}/REST/account/${id}`,
    strictSSL    : false,
    agentOptions : {
      cert : certificate,
      key  : certificate,
    }
  };

  request.get(params, (err, res) =>
    err || 200 !== res.statusCode ? reject(err) : resolve(AccountFactory.fromXml(res.body))
  );
});   

module.exports = {

  get: (id) => {
    const user = {};

    return getAccount(id)
      .then(account => Object.assign(user, account))
      .then(() => user.parent && user.parent.id ? getAccount(user.parent.id) : { organisation : null, subscriptions : []})
      .then(account => (Object.assign(user, {
        organisation  : account.organisation,
        subscriptions : user.subscriptions.concat(account.subscriptions.filter(subscription => subscription.isInheritable))
      })));
  }

};
