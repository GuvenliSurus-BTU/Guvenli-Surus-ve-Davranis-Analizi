const Device = require('../models/Device');

async function createDevice(payload) {
  return Device.create(payload);
}

async function listDevices(userId) {
  const query = userId ? { userId } : {};
  return Device.find(query).sort({ createdAt: -1 });
}

module.exports = { createDevice, listDevices };
