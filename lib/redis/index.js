const Redis = require('ioredis');
let redis = null;

module.exports = (options) => {
  if (!redis) {
    redis = new Redis(options.config.redisCluster);
  }
  return redis;
};