const Joi = require('joi');

const deviceSchema = Joi.object({
  label: Joi.string().required(),
  platform: Joi.string().valid('android', 'ios').required(),
  model: Joi.string().optional(),
  appVersion: Joi.string().optional(),
});

module.exports = { deviceSchema };
