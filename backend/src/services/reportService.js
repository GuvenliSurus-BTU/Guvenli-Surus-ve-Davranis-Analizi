const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Alarm = require('../models/Alarm');

const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };

function toObjectId(id) {
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}

async function tripReport(tripId) {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    const err = new Error('Trip not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const alarms = await Alarm.find({ tripId: trip._id });
  const alarmsByType = alarms.reduce((acc, alarm) => {
    acc[alarm.type] = (acc[alarm.type] || 0) + 1;
    return acc;
  }, {});

  const mostSevere = alarms.reduce((current, alarm) => {
    if (!current) return alarm;
    const a = SEVERITY_RANK[alarm.severity] || 0;
    const b = SEVERITY_RANK[current.severity] || 0;
    if (a > b) return alarm;
    if (a === b && Math.abs(alarm.value) > Math.abs(current.value)) return alarm;
    return current;
  }, null);

  return {
    trip,
    totalAlarms: alarms.length,
    alarmsByType,
    mostSevere,
  };
}

async function deviceDailyReport(deviceId, from, to) {
  const match = { deviceId: toObjectId(deviceId) };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
        },
        count: { $sum: 1 },
        avgValue: { $avg: '$value' },
        maxValue: { $max: '$value' },
      },
    },
    {
      $group: {
        _id: '$_id.day',
        total: { $sum: '$count' },
        byType: {
          $push: {
            type: '$_id.type',
            count: '$count',
            avgValue: '$avgValue',
            maxValue: '$maxValue',
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        total: 1,
        byType: 1,
      },
    },
  ];

  return Alarm.aggregate(pipeline);
}

module.exports = { tripReport, deviceDailyReport };
