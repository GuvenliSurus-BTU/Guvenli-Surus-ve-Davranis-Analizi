/*
 * Yapay sürüş simülatörü.
 *
 * Çalışan backend HTTP API'sine 1 saniyelik pencereler hâlinde sensör batch'leri
 * gönderir (her biri 50 okuma, 50 Hz, toplam 60 saniye = 3000 okuma).
 *
 * Gömülü olaylar (tohumlu LCG ile deterministik konumlar):
 *  - 2x sudden_brake
 *  - 1x sudden_acceleration
 *  - 2x sharp_turn
 *  - 1x excessive_jolt
 *
 * Kullanım:
 *   BASE_URL=http://localhost:3000 node scripts/simulateDrive.js
 *   DEVICE_ID=<id> node scripts/simulateDrive.js   (/devices boşsa yedek)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ENV_DEVICE_ID = process.env.DEVICE_ID;

const SAMPLE_RATE_HZ = 50;
const DRIVE_SECONDS = 60;
const STEP_MS = 1000 / SAMPLE_RATE_HZ; // 20 ms
const TOTAL_READINGS = SAMPLE_RATE_HZ * DRIVE_SECONDS; // 3000
const BATCH_SIZE = SAMPLE_RATE_HZ; // 50

const GRAVITY = 9.81;

// Linear Congruential Generator (Numerical Recipes sabitleri) — deterministik.
function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

function buildBaseline(rng, ts) {
  return {
    ts: new Date(ts).toISOString(),
    accel: {
      x: randRange(rng, -0.4, 0.4),
      y: randRange(rng, -0.4, 0.4),
      z: GRAVITY + randRange(rng, -0.2, 0.2),
    },
    gyro: {
      x: randRange(rng, -0.15, 0.15),
      y: randRange(rng, -0.15, 0.15),
      z: randRange(rng, -0.15, 0.15),
    },
    gps: {
      lat: 40.23 + randRange(rng, -0.0005, 0.0005),
      lng: 29.01 + randRange(rng, -0.0005, 0.0005),
      speed: randRange(rng, 8, 18),
      accuracy: randRange(rng, 3, 8),
    },
  };
}

/**
 * Taban (baseline) iz üzerine olay pencerelerini enjekte eder.
 * Her olay bitişik bir indeks aralığını kaplar; konumlar deterministiktir.
 *
 * 50 Hz × 60 s = 3000 örnek. `requiredSamplesAboveThreshold = 10` sınırını
 * aşmak için dedektör başına 12+ örnek > eşik gerekir. Güvenli olması için
 * her olay penceresine en az 16 örnek ayrılır.
 */
function injectEvents(readings, rng) {
  const events = [
    { type: 'sudden_brake', start: 200, length: 18, apply: (r) => { r.accel.y = -4.5 + randRange(rng, -0.2, 0.2); } },
    { type: 'sudden_brake', start: 900, length: 18, apply: (r) => { r.accel.y = -5.2 + randRange(rng, -0.2, 0.2); } },
    { type: 'sudden_acceleration', start: 1500, length: 18, apply: (r) => { r.accel.y = 3.6 + randRange(rng, -0.1, 0.1); } },
    {
      type: 'sharp_turn',
      start: 1900,
      length: 20,
      apply: (r) => {
        r.gyro.z = 1.8 + randRange(rng, -0.1, 0.1);
        r.accel.x = 4.4 + randRange(rng, -0.1, 0.1);
        r.gps.speed = 16 + randRange(rng, -0.5, 0.5);
      },
    },
    {
      type: 'sharp_turn',
      start: 2300,
      length: 20,
      apply: (r) => {
        r.gyro.z = -1.9 + randRange(rng, -0.1, 0.1);
        r.accel.x = -4.6 + randRange(rng, -0.1, 0.1);
        r.gps.speed = 14 + randRange(rng, -0.5, 0.5);
      },
    },
    {
      type: 'excessive_jolt',
      start: 2700,
      length: 1,
      apply: (r) => {
        r.accel.x = 10.5;
        r.accel.y = 0;
        r.accel.z = 16.0;
      },
    },
  ];

  for (const event of events) {
    for (let i = 0; i < event.length; i += 1) {
      const idx = event.start + i;
      if (idx >= 0 && idx < readings.length) {
        event.apply(readings[idx]);
      }
    }
  }

  return events;
}

async function httpJson(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function resolveDeviceId() {
  if (ENV_DEVICE_ID) return ENV_DEVICE_ID;

  const res = await httpJson('GET', '/api/v1/devices');
  if (!res.ok || !Array.isArray(res.data?.data) || !res.data.data.length) {
    throw new Error(
      `Cihazlar listelenemedi (durum ${res.status}). ` +
        'Önce `npm run seed` çalıştırın veya DEVICE_ID ortam değişkenini geçirin.',
    );
  }
  return res.data.data[0]._id;
}

async function main() {
  // Tek deterministik tohum → her çalıştırma birebir aynı sonucu üretir.
  const rng = createRng(0x5eed1234);

  const deviceId = await resolveDeviceId();
  const startTs = Date.now();

  // Önce 3000 örneklik tam izi oluştur, sonra olayları enjekte et.
  const readings = [];
  for (let i = 0; i < TOTAL_READINGS; i += 1) {
    readings.push(buildBaseline(rng, startTs + i * STEP_MS));
  }
  const events = injectEvents(readings, rng);

  let totalAlarms = 0;
  let totalInserted = 0;

  for (let offset = 0; offset < readings.length; offset += BATCH_SIZE) {
    const batch = readings.slice(offset, offset + BATCH_SIZE);
    const res = await httpJson('POST', '/api/v1/sensor-data', { deviceId, readings: batch });
    if (!res.ok) {
      throw new Error(`POST /sensor-data başarısız: ${res.status} ${JSON.stringify(res.data)}`);
    }
    totalInserted += res.data?.data?.inserted || 0;
    totalAlarms += res.data?.data?.alarms?.length || 0;
  }

  process.stdout.write(
    `Sürüş tamamlandı. eklenen=${totalInserted} tespit_edilen_alarm=${totalAlarms} ` +
      `gömülü_olay=${events.length}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`Simülatör başarısız: ${err.message}\n`);
  process.exit(1);
});
