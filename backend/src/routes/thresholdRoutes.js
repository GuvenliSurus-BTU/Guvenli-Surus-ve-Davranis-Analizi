const express = require('express');
const { getThresholds, putThresholds } = require('../controllers/thresholdController');
const { requireAuth, authorize } = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { thresholdSchema } = require('../validators/thresholdSchema');

const router = express.Router();

router.get('/:id/thresholds', requireAuth, getThresholds);
router.put('/:id/thresholds', requireAuth, authorize('admin'), validate(thresholdSchema), putThresholds);

module.exports = router;
