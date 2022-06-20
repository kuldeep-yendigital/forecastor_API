const crypto = require('crypto');

module.exports = {
  isMd5 : (string) => (/[a-fA-F0-9]{32}/).test(
    String(string)
  ),

  md5 : (data) => crypto.createHash('md5').update(data, 'utf8').digest('hex')
};
