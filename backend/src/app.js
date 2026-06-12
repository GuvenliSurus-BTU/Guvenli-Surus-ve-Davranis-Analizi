require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const sensorRoutes = require('./routes/sensorRoutes');
const alarmRoutes = require('./routes/alarmRoutes');
const tripRoutes = require('./routes/tripRoutes');
const thresholdRoutes = require('./routes/thresholdRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const healthRoutes = require('./routes/healthRoutes');
const speedLimitRoutes = require('./routes/speedLimitRoutes');

function createApp(io) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);
  app.use(
    rateLimit({
      windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
      max: Number(env.RATE_LIMIT_MAX),
    }),
  );

  if (io) {
    app.use((req, _res, next) => {
      req.io = io.of('/realtime');
      next();
    });
  }

  app.use('/api/v1/sensor-data', sensorRoutes);
  app.use('/api/v1/alarms', alarmRoutes);
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/devices', thresholdRoutes);
  app.use('/api/v1/devices', deviceRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/speed-limit', speedLimitRoutes);
  app.use('/', healthRoutes);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
