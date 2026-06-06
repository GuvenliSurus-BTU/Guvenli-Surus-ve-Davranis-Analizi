const SensorData = require('../models/SensorData');
const Device = require('../models/Device');

// ─── Eşik Değerleri (DB'den: config/thresholds.js ile uyumlu) ───────────────
const DEFAULT_THRESHOLDS = {
  suddenBrakeAccelMs2: -3.5,       // m/s² - ani fren (negatif Y ivmesi)
  suddenAccelerationMs2: 3.0,       // m/s² - ani hızlanma (pozitif Y ivmesi)
  sharpTurnYawRadS: 1.4,            // rad/s - sert dönüş (Z gyro)
  sharpTurnLateralMs2: 4.0,         // m/s² - sert dönüş (X ivmesi)
  minTurnSpeedMs: 4,                // m/s - dönüş için minimum hız
  joltMagnitudeDeltaMs2: 6.0,       // m/s² - aşırı sarsıntı büyüklüğü
  joltWindowStdMs2: 2.5,            // m/s² - aşırı sarsıntı standart sapması
};

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

function magnitude({ x = 0, y = 0, z = 0 } = {}) {
  return Math.sqrt(x * x + y * y + z * z);
}

function computeSeverity(value, threshold) {
  const ratio = Math.abs(value) / Math.abs(threshold);
  if (ratio >= 2.0) return 'high';
  if (ratio >= 1.4) return 'medium';
  return 'low';
}

function standardDeviation(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// ─── Anomali Tespit Fonksiyonları ─────────────────────────────────────────────

function detectSuddenBrake(readings, thresholds) {
  const hits = readings.filter((r) => r.accel && r.accel.y <= thresholds.suddenBrakeAccelMs2);
  if (hits.length < 3) return null;

  const minValue = Math.min(...hits.map((h) => h.accel.y));
  return {
    type: 'sudden_brake',
    value: minValue,
    threshold: thresholds.suddenBrakeAccelMs2,
    unit: 'm/s²',
    severity: computeSeverity(minValue, thresholds.suddenBrakeAccelMs2),
    gps: hits[hits.length - 1].gps || null,
  };
}

function detectSuddenAcceleration(readings, thresholds) {
  const hits = readings.filter((r) => r.accel && r.accel.y >= thresholds.suddenAccelerationMs2);
  if (hits.length < 3) return null;

  const maxValue = Math.max(...hits.map((h) => h.accel.y));
  return {
    type: 'sudden_acceleration',
    value: maxValue,
    threshold: thresholds.suddenAccelerationMs2,
    unit: 'm/s²',
    severity: computeSeverity(maxValue, thresholds.suddenAccelerationMs2),
    gps: hits[hits.length - 1].gps || null,
  };
}

function detectSharpTurn(readings, thresholds) {
  const hits = readings.filter((r) => {
    const yaw = Math.abs((r.gyro && r.gyro.z) || 0);
    const lateral = Math.abs((r.accel && r.accel.x) || 0);
    const speed = (r.gps && r.gps.speed) || r.speed;
    const hasSpeed = typeof speed === 'number';

    return (
      (yaw >= thresholds.sharpTurnYawRadS || lateral >= thresholds.sharpTurnLateralMs2) &&
      (!hasSpeed || speed >= thresholds.minTurnSpeedMs)
    );
  });

  if (hits.length < 3) return null;

  const maxYaw = Math.max(...hits.map((h) => Math.abs((h.gyro && h.gyro.z) || 0)));
  const maxLateral = Math.max(...hits.map((h) => Math.abs((h.accel && h.accel.x) || 0)));
  const usesYaw = maxYaw >= thresholds.sharpTurnYawRadS;
  const value = usesYaw ? maxYaw : maxLateral;
  const threshold = usesYaw ? thresholds.sharpTurnYawRadS : thresholds.sharpTurnLateralMs2;

  return {
    type: 'sharp_turn',
    value,
    threshold,
    unit: usesYaw ? 'rad/s' : 'm/s²',
    severity: computeSeverity(value, threshold),
    gps: hits[hits.length - 1].gps || null,
  };
}

function detectExcessiveJolt(readings, thresholds) {
  const magnitudes = readings.map((r) => Math.abs(magnitude(r.accel) - 9.81));
  const maxMag = Math.max(...magnitudes);
  const std = standardDeviation(magnitudes);

  if (maxMag < thresholds.joltMagnitudeDeltaMs2 && std < thresholds.joltWindowStdMs2) {
    return null;
  }

  return {
    type: 'excessive_jolt',
    value: maxMag,
    threshold: thresholds.joltMagnitudeDeltaMs2,
    unit: 'm/s²',
    severity: computeSeverity(maxMag, thresholds.joltMagnitudeDeltaMs2),
    gps: (readings[readings.length - 1] && readings[readings.length - 1].gps) || null,
    evidence: { std },
  };
}

// ─── Ana Analiz Fonksiyonu ────────────────────────────────────────────────────

function analyzeReadings(readings, thresholds = DEFAULT_THRESHOLDS) {
  const detectedAlarms = [];

  const brake = detectSuddenBrake(readings, thresholds);
  if (brake) detectedAlarms.push(brake);

  const accel = detectSuddenAcceleration(readings, thresholds);
  if (accel) detectedAlarms.push(accel);

  const turn = detectSharpTurn(readings, thresholds);
  if (turn) detectedAlarms.push(turn);

  const jolt = detectExcessiveJolt(readings, thresholds);
  if (jolt) detectedAlarms.push(jolt);

  return detectedAlarms;
}

// ─── Sensör Verisi Kaydetme ───────────────────────────────────────────────────

async function saveSensorData(deviceId, readings) {
  // cihazın son görülme zamanını güncelle
  await Device.findByIdAndUpdate(deviceId, { lastSeenAt: new Date() });

  const docs = readings.map((r) => ({
    ts: r.ts ? new Date(r.ts) : new Date(),
    meta: {
      deviceId,
      tripId: r.tripId || null,
    },
    accel: r.accel,
    gyro: r.gyro,
    gps: r.gps || null,
    speed: r.speed || null,
  }));

  return SensorData.insertMany(docs);
}

// ─── Geçmiş Sensör Verilerini Getir ──────────────────────────────────────────

async function getSensorHistory(deviceId, { from, to, limit = 100, page = 1 } = {}) {
  const query = { 'meta.deviceId': deviceId };

  if (from || to) {
    query.ts = {};
    if (from) query.ts.$gte = new Date(from);
    if (to) query.ts.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    SensorData.find(query).sort({ ts: -1 }).skip(skip).limit(Number(limit)),
    SensorData.countDocuments(query),
  ]);

  return { items, meta: { total, page: Number(page), limit: Number(limit) } };
}

module.exports = {
  analyzeReadings,
  saveSensorData,
  getSensorHistory,
  DEFAULT_THRESHOLDS,
};