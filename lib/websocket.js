const socket = require('socket.io');
const { getLogger } = require('./logger');
const cookie = require('cookie');
let websocket = null;
let io = null

const getWebsocket = (server) => {
  if (websocket && io) return {
    socket: websocket,
    io: io
  };

  const logger = getLogger();


  io = socket.listen(server, {
    origins: '*:*',
    handlePreflightRequest: (req, res) => {
      const headers = {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': req.headers.origin,
        'Access-Control-Allow-Credentials': true
      };
      res.writeHead(200, headers);
      res.end();
    },
    pingInterval: 3000,
    pingTimeout: 20000
  });

  io.on('connection', (sock) => {
    // Emit the client id back to the client
    websocket = sock;
    let cookies = {};

    if (sock.request && sock.request.headers && sock.request.headers.cookie) {
      cookies = cookie.parse(sock.request.headers.cookie);
    }

    const state = {
      state: 'ready',
      id: sock.client.id,
      ALB: cookies.AWSALB || ''
    }

    sock.emit('state', state);
    logger.info(`[Websocket] Connection initialised for client ${sock.client.id} on server ${server.address().address}`);
    sock.on('error', (error) => {
      logger.error(JSON.stringify(error));
    })
  });

  return {
    socket: websocket,
    io: io
  };
};

module.exports = {
  getWebsocket: getWebsocket
};