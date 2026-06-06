const express = require('express');
const router = express.Router();
const {
  ingestBatch,
  ingestSingle,
  getSensorData,
  analyzeDevice,
} = require('../controllers/sensorController');
const { protect } = require('../middleware/authMiddleware');

// Tüm route'lar korumalı
router.use(protect);

// POST /api/sensors          - Tek veri gönder
// POST /api/sensors/batch    - Toplu veri gönder + anomali analizi
router.post('/', ingestSingle);
router.post('/batch', ingestBatch);

// GET /api/sensors/:deviceId          - Geçmiş verileri getir
// GET /api/sensors/:deviceId/analyze  - Anlık analiz yap
router.get('/:deviceId', getSensorData);
router.get('/:deviceId/analyze', analyzeDevice);

module.exports = router;