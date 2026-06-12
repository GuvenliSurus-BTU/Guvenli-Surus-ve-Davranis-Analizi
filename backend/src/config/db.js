const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./env');

async function connectDb() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  logger.info('MongoDB connected');
}

module.exports = { connectDb, mongoose };
