const ThresholdConfig = require('../models/ThresholdConfig');

async function getDeviceThresholds(deviceId) {
  return ThresholdConfig.findOne({ deviceId });
}

async function upsertDeviceThresholds(deviceId, overrides, userId) {
  return ThresholdConfig.findOneAndUpdate(
    { deviceId },
    { overrides, updatedBy: userId },
    { upsert: true, new: true },
  );
}

module.exports = { getDeviceThresholds, upsertDeviceThresholds };
