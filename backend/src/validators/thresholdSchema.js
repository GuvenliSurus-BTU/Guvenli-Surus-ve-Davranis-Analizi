const Joi = require('joi');

const thresholdSchema = Joi.object({
  overrides: Joi.object({
    suddenBrakeAccelMs2: Joi.number(),
    suddenAccelerationMs2: Joi.number(),
    sharpTurnYawRadS: Joi.number(),
    sharpTurnLateralMs2: Joi.number(),
    minTurnSpeedMs: Joi.number(),
    joltMagnitudeDeltaMs2: Joi.number(),
    joltWindowStdMs2: Joi.number(),
    eventCooldownMs: Joi.number(),
    slidingWindowSec: Joi.number(),
    requiredSamplesAboveThreshold: Joi.number(),
    sampleRateHz: Joi.number(),
    speedLimitMs: Joi.number().min(0),
  }).required(),
});

module.exports = { thresholdSchema };
