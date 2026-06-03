const asyncHandler = require('../utils/asyncHandler');
const { ingestSensorBatch, listSensorData } = require('../services/sensorService');
const { startTrip } = require('../services/tripService');

const postSensorData = asyncHandler(async (req, res) => {
  const { deviceId, tripId, readings } = req.body;
  const activeTrip = tripId || (await startTrip({ deviceId, userId: req.user._id }))._id;

  const result = await ingestSensorBatch({
    deviceId,
    tripId: activeTrip,
    readings,
  });

  if (req.io && result.alarms.length) {
    result.alarms.forEach((alarm) => req.io.to(`device:${alarm.deviceId}`).emit('alarm:new', alarm));
  }

  return res.status(201).json({ data: result });
});

const getSensorData = asyncHandler(async (req, res) => {
  const data = await listSensorData(req.query);
  return res.json({ data });
});

module.exports = { postSensorData, getSensorData };
