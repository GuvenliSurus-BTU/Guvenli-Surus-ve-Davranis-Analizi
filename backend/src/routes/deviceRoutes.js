const express = require('express');
const router = express.Router();
const {
  registerDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  heartbeat,
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

// Tüm route'lar korumalı
router.use(protect);

// POST   /api/devices        - Cihaz kaydet
// GET    /api/devices        - Kullanıcının cihazlarını listele
router.route('/').post(registerDevice).get(getDevices);

// GET    /api/devices/:id    - Tek cihaz getir
// PUT    /api/devices/:id    - Cihaz güncelle
// DELETE /api/devices/:id    - Cihaz sil
router.route('/:id').get(getDeviceById).put(updateDevice).delete(deleteDevice);

// PATCH /api/devices/:id/heartbeat - Son görülme güncelle
router.patch('/:id/heartbeat', heartbeat);

module.exports = router;