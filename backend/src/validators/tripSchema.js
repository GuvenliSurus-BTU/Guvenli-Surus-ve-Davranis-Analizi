const Joi = require('joi');

const tripStartSchema = Joi.object({
  deviceId: Joi.string().required(),
});

module.exports = { tripStartSchema };
