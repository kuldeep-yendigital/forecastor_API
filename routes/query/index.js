const express = require('express');
const config = require('./../../config');
const DataStream = require('./../../lib/data');
const { getWebsocket } = require('../../lib/websocket');
const { getLogger } = require('../../lib/logger');

const router = express.Router();

router.post('/query', (req, res) => {
  const socketClientId = req.body.client_id;
  const { io } = getWebsocket();
  const logger = getLogger();

  res.setTimeout(120000);
  res.status(202);
  res.send({
    msg: 'Request accepted. Data will follow in the acquired socket.'
  });

  const stream = new DataStream({
    config: config
  });

  stream.on('end', () => {
    logger.info(`Emitting data to ${socketClientId} from ${req.connection.localAddress}`);
    io.sockets.in(socketClientId).emit('data', stream.jsonData);
  });
  
  // stream.pipe(res);
  req.body.subscriptions = req.auth.subscriptions.map(subscription => subscription.value);
  stream.query(req.body);
});

module.exports = router;