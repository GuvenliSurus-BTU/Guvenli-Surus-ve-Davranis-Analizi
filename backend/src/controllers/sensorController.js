const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const { analyzeReadings, saveSensorData, getSensorHistory } = require('../services/sensorService');

// @desc    Toplu sensör verisi gönder + anomali tespit
// @route   POST /api/sensors/batch
// @access  Private
const ingestBatch = async (req, res) => {
  try {
    const { deviceId, readings } = req.body;

    if (!deviceId || !readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ message: 'deviceId ve readings (dizi) zorunludur' });
    }

    // Cihaz kullanıcıya ait mi?
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihaza veri gönderme yetkiniz yok' });
    }

    // Her okuma için gerekli alanları doğrula
    for (const r of readings) {
      if (!r.accel || r.accel.x === undefined || r.accel.y === undefined || r.accel.z === undefined) {
        return res.status(400).json({ message: 'Her okumada accel {x, y, z} zorunludur' });
      }
      if (!r.gyro || r.gyro.x === undefined || r.gyro.y === undefined || r.gyro.z === undefined) {
        return res.status(400).json({ message: 'Her okumada gyro {x, y, z} zorunludur' });
      }
    }

    // Verileri kaydet
    const saved = await saveSensorData(deviceId, readings);

    // Anomali tespiti yap
    const alarms = analyzeReadings(readings);

    res.status(201).json({
      message: `${saved.length} sensör verisi kaydedildi`,
      count: saved.length,
      alarms,
      alarmCount: alarms.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tek sensör verisi gönder
// @route   POST /api/sensors
// @access  Private
const ingestSingle = async (req, res) => {
  try {
    const { deviceId, ts, accel, gyro, gps, speed, tripId } = req.body;

    if (!deviceId || !accel || !gyro) {
      return res.status(400).json({ message: 'deviceId, accel ve gyro zorunludur' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihaza veri gönderme yetkiniz yok' });
    }

    const sensorData = await SensorData.create({
      ts: ts ? new Date(ts) : new Date(),
      meta: { deviceId, tripId: tripId || null },
      accel,
      gyro,
      gps: gps || null,
      speed: speed || null,
    });

    // Son görülme zamanını güncelle
    await Device.findByIdAndUpdate(deviceId, { lastSeenAt: new Date() });

    res.status(201).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Belirli cihazın sensör geçmişini getir
// @route   GET /api/sensors/:deviceId
// @access  Private
const getSensorData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { from, to, limit = 100, page = 1 } = req.query;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihazın verilerine erişim yetkiniz yok' });
    }

    const result = await getSensorHistory(deviceId, { from, to, limit, page });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Son N sensör verisini getir ve anlık anomali analizi yap
// @route   GET /api/sensors/:deviceId/analyze
// @access  Private
const analyzeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const windowSize = parseInt(req.query.window) || 50;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihaza erişim yetkiniz yok' });
    }

    const recentReadings = await SensorData.find({ 'meta.deviceId': deviceId })
      .sort({ ts: -1 })
      .limit(windowSize)
      .lean();

    // Zaman sırasıyla sırala (en eski önce)
    recentReadings.reverse();

    const alarms = analyzeReadings(recentReadings);

    res.json({
      deviceId,
      readingsAnalyzed: recentReadings.length,
      alarms,
      alarmCount: alarms.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { ingestBatch, ingestSingle, getSensorData, analyzeDevice };const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const { analyzeReadings, saveSensorData, getSensorHistory } = require('../services/sensorService');

// @desc    Toplu sensör verisi gönder + anomali tespit
// @route   POST /api/sensors/batch
// @access  Private
const ingestBatch = async (req, res) => {
  try {
    const { deviceId, readings } = req.body;

    if (!deviceId || !readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ message: 'deviceId ve readings (dizi) zorunludur' });
    }

    // Cihaz kullanıcıya ait mi?
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihaza veri gönderme yetkiniz yok' });
    }

    // Her okuma için gerekli alanları doğrula
    for (const r of readings) {
      if (!r.accel || r.accel.x === undefined || r.accel.y === undefined || r.accel.z === undefined) {
        return res.status(400).json({ message: 'Her okumada accel {x, y, z} zorunludur' });
      }
      if (!r.gyro || r.gyro.x === undefined || r.gyro.y === undefined || r.gyro.z === undefined) {
        return res.status(400).json({ message: 'Her okumada gyro {x, y, z} zorunludur' });
      }
    }

    // Verileri kaydet
    const saved = await saveSensorData(deviceId, readings);

    // Anomali tespiti yap
    const alarms = analyzeReadings(readings);

    res.status(201).json({
      message: `${saved.length} sensör verisi kaydedildi`,
      count: saved.length,
      alarms,
      alarmCount: alarms.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tek sensör verisi gönder
// @route   POST /api/sensors
// @access  Private
const ingestSingle = async (req, res) => {
  try {
    const { deviceId, ts, accel, gyro, gps, speed, tripId } = req.body;

    if (!deviceId || !accel || !gyro) {
      return res.status(400).json({ message: 'deviceId, accel ve gyro zorunludur' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihaza veri gönderme yetkiniz yok' });
    }

    const sensorData = await SensorData.create({
      ts: ts ? new Date(ts) : new Date(),
      meta: { deviceId, tripId: tripId || null },
      accel,
      gyro,
      gps: gps || null,
      speed: speed || null,
    });

    // Son görülme zamanını güncelle
    await Device.findByIdAndUpdate(deviceId, { lastSeenAt: new Date() });

    res.status(201).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Belirli cihazın sensör geçmişini getir
// @route   GET /api/sensors/:deviceId
// @access  Private
const getSensorData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { from, to, limit = 100, page = 1 } = req.query;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihazın verilerine erişim yetkiniz yok' });
    }

    const result = await getSensorHistory(deviceId, { from, to, limit, page });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Son N sensör verisini getir ve anlık anomali analizi yap
// @route   GET /api/sensors/:deviceId/analyze
// @access  Private
const analyzeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const windowSize = parseInt(req.query.window) || 50;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihaza erişim yetkiniz yok' });
    }

    const recentReadings = await SensorData.find({ 'meta.deviceId': deviceId })
      .sort({ ts: -1 })
      .limit(windowSize)
      .lean();

    // Zaman sırasıyla sırala (en eski önce)
    recentReadings.reverse();

    const alarms = analyzeReadings(recentReadings);

    res.json({
      deviceId,
      readingsAnalyzed: recentReadings.length,
      alarms,
      alarmCount: alarms.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { ingestBatch, ingestSingle, getSensorData, analyzeDevice };