const convert = require('xml-js');
const jp = require('jsonpath');
const whitelist = require('./../../config').sams.productIds;

const extract = {
  lastUrlSegment : (url) => url.substr(url.lastIndexOf('/') + 1),
  subscriptions  : (subscriptions) => {
    if (!Array.isArray(subscriptions)) {
      if (subscriptions instanceof Object) subscriptions = [ subscriptions ];
      else return [];
    }

    return subscriptions.reduce((acc, subscription) => {
      const id = parse.toInt(extract.lastUrlSegment(subscription._attributes['x:href']));
      const isInheritable = 1 === parse.toInt(subscription.is_inheritable._text);
      const productId = extract.lastUrlSegment(subscription.pe_id._attributes['x:href']);
      const type = extract.lastUrlSegment(subscription.subscription_type_id._attributes['x:href']);

      if ('OK' !== subscription.status._text) return acc;
      if (-1 >= whitelist.indexOf(productId)) return acc;
      if (-1 >= acc.findIndex((el => id === el.id)))
        acc.push({ id, isInheritable, productId, type});

      return acc;
    }, []);
  }
};

const parse = {
  toInt : (str) => parseInt(str, 10)
};

const sort = {
  subscriptions : (arr) => arr.sort((a, b) => {
    if(a.id < b.id) return -1;
    if(a.id > b.id) return 1;
    return 0;
  })
};

const value = (object, jsonpath, defaultValue, fn) => {
  const result = jp.query(object, jsonpath).pop();

  if (undefined === result)
    return undefined !== defaultValue ? defaultValue : null;

  if ('function' === typeof fn)
    return fn(result);

  if (Array.isArray(fn))
    return fn.reduce((val, fn) => fn(val), result);

  return result;
};

module.exports = {
  create : data => {
    const src = data['sams:resource'];

    return {
      contact       : {
        email      : value(src, '$.contact_email._text'),
        familyName : value(src, '$.contact_family_name._text'),
        givenName  : value(src, '$.contact_given_name._text'),
        title      : value(src, '$.contact_title._text'),
      },
      id            : value(src, '$._attributes["xml:base"]', null, [extract.lastUrlSegment, parse.toInt]),
      organisation  : value(src, '$.organisation._text'),
      parent        : {
        id : value(src, '$.parent_acc_id._text', null, parse.toInt),
      },
      password      : value(src, '$.credential_userpass.password._text', ''),
      subscriptions : value(src, '$.subscription', [], [extract.subscriptions, sort.subscriptions]),
      type          : value(src, '$.account_type_id._attributes["x:href"]', null, [extract.lastUrlSegment, parse.toInt]),
    };
  },

  fromJson : json => module.exports.create(JSON.parse(json)),

  fromXml : xml => module.exports.fromJson(
    convert.xml2json(xml, { compact: true, spaces: 2 })
  )
}
