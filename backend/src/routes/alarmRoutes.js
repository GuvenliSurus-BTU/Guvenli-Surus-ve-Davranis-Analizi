const express = require('express');
const { getAlarms, getAlarmById } = require('../controllers/alarmController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', requireAuth, getAlarms);
router.get('/:id', requireAuth, getAlarmById);

module.exports = router;
