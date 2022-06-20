const port = process.env.PORT || 3000;
const app = require('./app');
const config = require('./config');
const { getWebsocket } = require('./lib/websocket');


const server = app().listen(port, () => {
  console.log(`Server is listening to port: ${port}, environment is ${process.env.environment}`);
});

getWebsocket(server, config);