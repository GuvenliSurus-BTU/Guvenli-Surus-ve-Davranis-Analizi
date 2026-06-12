const mongoose = require('mongoose');

const thresholdConfigSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, unique: true },
    overrides: {
      suddenBrakeAccelMs2: Number,
      suddenAccelerationMs2: Number,
      sharpTurnYawRadS: Number,
      sharpTurnLateralMs2: Number,
      minTurnSpeedMs: Number,
      joltMagnitudeDeltaMs2: Number,
      joltWindowStdMs2: Number,
      eventCooldownMs: Number,
      slidingWindowSec: Number,
      requiredSamplesAboveThreshold: Number,
      sampleRateHz: Number,
      speedLimitMs: Number,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ThresholdConfig', thresholdConfigSchema);
