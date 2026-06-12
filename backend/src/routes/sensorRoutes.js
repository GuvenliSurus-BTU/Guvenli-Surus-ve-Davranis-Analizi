const express = require('express');
const { postSensorData, getSensorData } = require('../controllers/sensorController');
const { requireAuth } = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { sensorBatchSchema } = require('../validators/sensorSchema');

const router = express.Router();

/**
 * @openapi
 * /api/v1/sensor-data:
 *   post:
 *     summary: Ingest sensor readings batch
 */
router.post('/', requireAuth, validate(sensorBatchSchema), postSensorData);
router.get('/', requireAuth, getSensorData);

module.exports = router;
