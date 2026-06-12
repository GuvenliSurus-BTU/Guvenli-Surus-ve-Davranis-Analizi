require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const logger = require('./utils/logger');
const { initRealtime } = require('./realtime/socket');

async function bootstrap() {
  await connectDb();

  const express = require('express');
  const rootApp = express();
  const server = http.createServer(rootApp);
  
  const io = new Server(server, { cors: { origin: '*' } });
  initRealtime(io);

  const app = createApp(io);
  rootApp.use(app);

  server.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

if (require.main === module) {
  bootstrap().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}

module.exports = { bootstrap };
