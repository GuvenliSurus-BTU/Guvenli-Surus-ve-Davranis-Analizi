const pinoHttp = require('pino-http');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  return pinoHttp({ logger })(req, res, next);
}

module.exports = requestLogger;
