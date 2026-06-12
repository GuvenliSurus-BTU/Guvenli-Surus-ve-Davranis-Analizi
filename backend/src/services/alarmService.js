const Alarm = require('../models/Alarm');

async function createMany(alarms) {
  if (!alarms.length) return [];
  return Alarm.insertMany(alarms);
}

async function list(filters = {}, options = {}) {
  const query = {};
  if (filters.deviceId) query.deviceId = filters.deviceId;
  if (filters.tripId) query.tripId = filters.tripId;
  if (filters.type) query.type = filters.type;
  if (filters.severity) query.severity = filters.severity;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const page = Number(options.page || 1);
  const limit = Number(options.limit || 20);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Alarm.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Alarm.countDocuments(query),
  ]);

  return { items, meta: { total, page, limit } };
}

async function getById(id) {
  return Alarm.findById(id);
}

module.exports = { createMany, list, getById };
