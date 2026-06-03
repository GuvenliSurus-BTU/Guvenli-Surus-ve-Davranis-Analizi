const SensorReading = require('../models/SensorReading');
const AnalysisRun = require('../models/AnalysisRun');
const { analyzeBatch } = require('./anomalyDetection');
const { createMany } = require('./alarmService');
const { getDeviceThresholds } = require('./thresholdService');

async function ingestSensorBatch({ deviceId, tripId, readings }) {
  const normalizedReadings = readings.map((reading) => ({
    ...reading,
    ts: new Date(reading.ts),
    meta: { deviceId, tripId },
  }));

  await SensorReading.insertMany(normalizedReadings);

  const thresholds = await getDeviceThresholds(deviceId);
  const detected = analyzeBatch({
    deviceId,
    readings: normalizedReadings,
    thresholdOverride: thresholds?.overrides,
  });

  const alarms = detected.map((alarm) => ({ ...alarm, deviceId, tripId }));
  const persistedAlarms = await createMany(alarms);

  await AnalysisRun.create({
    deviceId,
    tripId,
    readingsCount: normalizedReadings.length,
    alarmsCount: persistedAlarms.length,
  });

  return {
    inserted: normalizedReadings.length,
    alarms: persistedAlarms,
  };
}

async function listSensorData({ deviceId, from, to, limit = 100 }) {
  const query = {};
  if (deviceId) query['meta.deviceId'] = deviceId;
  if (from || to) {
    query.ts = {};
    if (from) query.ts.$gte = new Date(from);
    if (to) query.ts.$lte = new Date(to);
  }

  return SensorReading.find(query).sort({ ts: -1 }).limit(Number(limit));
}

module.exports = { ingestSensorBatch, listSensorData };
