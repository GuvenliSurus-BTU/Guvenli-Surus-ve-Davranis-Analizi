const asyncHandler = require('../utils/asyncHandler');
const tripService = require('../services/tripService');

const startTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.startTrip({
    deviceId: req.body.deviceId,
    userId: req.user._id,
  });
  return res.status(201).json({ data: trip });
});

const endTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.endTrip(req.params.id);
  return res.json({ data: trip });
});

const listTrips = asyncHandler(async (req, res) => {
  const trips = await tripService.listTrips(req.query);
  return res.json({ data: trips });
});

const getTripById = asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id);
  if (!trip) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trip not found' } });
  }
  return res.json({ data: trip });
});

module.exports = { startTrip, endTrip, listTrips, getTripById };
