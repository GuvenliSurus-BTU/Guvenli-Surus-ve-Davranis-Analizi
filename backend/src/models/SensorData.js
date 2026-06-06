const mongoose = require('mongoose');

// DB'deki SensorReading şemasıyla tam uyumlu
const sensorDataSchema = new mongoose.Schema(
  {
    // Zaman damgası (DB'de timeseries timeField = 'ts')
    ts: {
      type: Date,
      required: [true, 'Zaman damgası zorunludur'],
      default: Date.now,
    },
    // Meta verisi (DB'de timeseries metaField = 'meta')
    meta: {
      deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: [true, 'Cihaz ID zorunludur'],
        index: true,
      },
      tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        default: null,
      },
    },
    // İvmemetre verisi (m/s²)
    accel: {
      x: { type: Number, required: [true, 'accel.x zorunludur'] },
      y: { type: Number, required: [true, 'accel.y zorunludur'] },
      z: { type: Number, required: [true, 'accel.z zorunludur'] },
    },
    // Jiroskop verisi (rad/s)
    gyro: {
      x: { type: Number, required: [true, 'gyro.x zorunludur'] },
      y: { type: Number, required: [true, 'gyro.y zorunludur'] },
      z: { type: Number, required: [true, 'gyro.z zorunludur'] },
    },
    // GPS verisi (opsiyonel)
    gps: {
      lat: Number,
      lng: Number,
      speed: Number,    // m/s
      accuracy: Number, // metre
    },
    speed: Number, // m/s (GPS'ten ayrı)
  },
  {
    collection: 'sensor_readings',
    timestamps: false,
  },
);

sensorDataSchema.index({ 'meta.deviceId': 1, ts: -1 });
sensorDataSchema.index({ 'meta.tripId': 1, ts: 1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);