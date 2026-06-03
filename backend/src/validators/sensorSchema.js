const Joi = require('joi');

const readingSchema = Joi.object({
  ts: Joi.date().required(),
  accel: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
    z: Joi.number().required(),
  }).required(),
  gyro: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
    z: Joi.number().required(),
  }).required(),
  gps: Joi.object({
    lat: Joi.number(),
    lng: Joi.number(),
    speed: Joi.number(),
    accuracy: Joi.number(),
  }).optional(),
  speed: Joi.number().optional(),
});

const sensorBatchSchema = Joi.object({
  deviceId: Joi.string().required(),
  tripId: Joi.string().optional(),
  readings: Joi.array().items(readingSchema).min(1).required(),
});

module.exports = { sensorBatchSchema };
