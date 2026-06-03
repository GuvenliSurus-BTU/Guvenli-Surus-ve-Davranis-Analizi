const asyncHandler = require('../utils/asyncHandler');
const alarmService = require('../services/alarmService');

const getAlarms = asyncHandler(async (req, res) => {
  const result = await alarmService.list(req.query, req.query);
  return res.json({ data: result.items, meta: result.meta });
});

const getAlarmById = asyncHandler(async (req, res) => {
  const alarm = await alarmService.getById(req.params.id);
  if (!alarm) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Alarm not found' } });
  }
  return res.json({ data: alarm });
});

module.exports = { getAlarms, getAlarmById };
