const express = require('express');
const router = express.Router();
const config = require('../../config');
const redis = require('../../lib/redis');

router.get('/status', (req, res) => {
  res.sendStatus(200);
});

router.get('/flush-redis', (req, res) => {
  const redisClient = redis(config);

  redisClient.flushall()
    .then(() => {
      res.send('Cache cleared.');
    });
})

module.exports = router;
