const asyncHandler = require('../utils/asyncHandler');
const { ingestSensorBatch, listSensorData } = require('../services/sensorService');
const { startTrip } = require('../services/tripService');

const postSensorData = asyncHandler(async (req, res) => {
  let { deviceId, tripId, readings } = req.body;
  
  // Mobil uygulamadan gelen 'mobile-device-01' gibi geçersiz ObjectId'leri düzelt
  if (!deviceId || !/^[0-9a-fA-F]{24}$/.test(deviceId)) {
    deviceId = '000000000000000000000002';
  }

  const activeTrip = tripId || (await startTrip({ deviceId, userId: req.user._id }))._id;

  const result = await ingestSensorBatch({
    deviceId,
    tripId: activeTrip,
    readings,
  });

  if (req.io && result.alarms.length) {
    result.alarms.forEach((alarm) => req.io.to(`device:${alarm.deviceId}`).emit('alarm:new', alarm));
  }

  // Dashboard canlı grafiği için tüm toplu verileri yayınla
  if (req.io && readings && readings.length > 0) {
    const mappedReadings = readings.map(r => ({
      ts: r.ts || new Date().toISOString(),
      ivmeY: r.accel ? r.accel.y : 0,
      hiz: (r.gps && r.gps.speed) ? r.gps.speed : 0,
      lat: (r.gps && r.gps.lat) ? r.gps.lat : null,
      lng: (r.gps && r.gps.lng) ? r.gps.lng : null
    }));
    req.io.emit('yeni-sensor-verisi-toplu', mappedReadings);
  }

  return res.status(201).json({ data: result });
});

const getSensorData = asyncHandler(async (req, res) => {
  const data = await listSensorData(req.query);
  return res.json({ data });
});

module.exports = { postSensorData, getSensorData };
