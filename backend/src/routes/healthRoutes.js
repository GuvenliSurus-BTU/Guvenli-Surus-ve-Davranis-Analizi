const express = require('express');
const { health } = require('../controllers/healthController');

const router = express.Router();

router.get('/healthz', health);
router.get('/readyz', health);

module.exports = router;
