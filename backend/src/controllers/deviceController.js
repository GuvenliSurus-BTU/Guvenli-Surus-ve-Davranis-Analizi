const asyncHandler = require('../utils/asyncHandler');
const deviceService = require('../services/deviceService');

const createDevice = asyncHandler(async (req, res) => {
  const payload = { ...req.body, userId: req.user._id };
  const device = await deviceService.createDevice(payload);
  return res.status(201).json({ data: device });
});

const getDevices = asyncHandler(async (req, res) => {
  const devices = await deviceService.listDevices(
    req.user.role === 'admin' ? undefined : req.user._id,
  );
  return res.json({ data: devices });
});

module.exports = { createDevice, getDevices };
