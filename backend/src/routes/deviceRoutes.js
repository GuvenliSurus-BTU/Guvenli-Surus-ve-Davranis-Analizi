const express = require('express');
const { createDevice, getDevices } = require('../controllers/deviceController');
const { requireAuth } = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { deviceSchema } = require('../validators/deviceSchema');

const router = express.Router();

router.post('/', requireAuth, validate(deviceSchema), createDevice);
router.get('/', requireAuth, getDevices);

module.exports = router;
