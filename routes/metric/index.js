const express = require('express');
const router = express.Router();
const config = require('./../../config');
const DataStream = require('./../../lib/data');

router.get('/metrics', (req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'application/json');

  const stream = new DataStream({
    config: config
  });
  stream.pipe(res);
  stream.metrics({
    subscriptions : req.auth.subscriptions.map(subscription => subscription.value)
  });
});

module.exports = router;
