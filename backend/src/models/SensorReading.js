const mongoose = require('mongoose');

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

const sensorReadingSchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true },
    meta: {
      deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
      tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    },
    accel: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
    gyro: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
    gps: {
      lat: Number,
      lng: Number,
      speed: Number,
      accuracy: Number,
    },
    speed: Number,
  },
  {
    collection: 'sensor_readings',
    timeseries: {
      timeField: 'ts',
      metaField: 'meta',
      granularity: 'seconds',
    },
    expireAfterSeconds: THIRTY_DAYS_SECONDS,
  },
);

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
