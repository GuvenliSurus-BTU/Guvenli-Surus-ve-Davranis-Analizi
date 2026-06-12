const express = require('express');
const { getSpeedLimit } = require('../services/speedLimitService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters are required' });
  }

  const speedLimit = await getSpeedLimit(parseFloat(lat), parseFloat(lng));
  
  return res.json({ 
    lat: parseFloat(lat), 
    lng: parseFloat(lng), 
    speedLimit 
  });
}));

module.exports = router;
