const Trip = require('../models/Trip');
const Alarm = require('../models/Alarm');

async function startTrip({ deviceId, userId }) {
  const existing = await Trip.findOne({ deviceId, status: 'active' });
  if (existing) return existing;

  return Trip.create({ deviceId, userId, status: 'active' });
}

async function endTrip(tripId) {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    const err = new Error('Trip not found');
    err.status = 404;
    throw err;
  }

  const alarms = await Alarm.find({ tripId });
  const alarmByType = alarms.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  trip.status = 'ended';
  trip.endedAt = new Date();
  trip.summary = {
    totalAlarms: alarms.length,
    alarmByType,
  };

  await trip.save();
  return trip;
}

async function listTrips(filters = {}) {
  const query = {};
  if (filters.deviceId) query.deviceId = filters.deviceId;
  if (filters.status) query.status = filters.status;
  return Trip.find(query).sort({ startedAt: -1 }).limit(Number(filters.limit || 20));
}

async function getTripById(id) {
  return Trip.findById(id);
}

module.exports = { startTrip, endTrip, listTrips, getTripById };
