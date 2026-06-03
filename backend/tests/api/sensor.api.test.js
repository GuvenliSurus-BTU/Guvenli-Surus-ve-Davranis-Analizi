process.env.AUTH_MODE = 'bypass';
process.env.JWT_SECRET = 'test_secret_123';
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_MAX = '10000';

const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

jest.setTimeout(60000);

let mongoServer;
let mongoose;
let app;
let Device;
let Trip;

async function setupMongoMemoryServer() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  // After env is set, require modules that read process.env.
  mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);

  Device = require('../../src/models/Device');
  Trip = require('../../src/models/Trip');
  app = require('../../src/app')();
}

async function teardown() {
  if (mongoose && mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) await mongoServer.stop();
}

describe('sensor api', () => {
  beforeAll(async () => {
    await setupMongoMemoryServer();
  });

  afterAll(async () => {
    await teardown();
  });

  test('GET /healthz returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  test('POST /api/v1/sensor-data ingests batch and creates a sudden_brake alarm', async () => {
    const device = await Device.create({
      userId: new mongoose.Types.ObjectId(),
      label: 'Test Device',
      platform: 'android',
    });
    const trip = await Trip.create({
      deviceId: device._id,
      userId: device.userId,
      status: 'active',
    });

    const start = Date.now();
    const readings = Array.from({ length: 30 }, (_, i) => ({
      ts: new Date(start + i * 20).toISOString(),
      accel: { x: 0.1, y: -4.5, z: 9.8 },
      gyro: { x: 0.0, y: 0.0, z: 0.1 },
      gps: { lat: 40, lng: 29, speed: 12, accuracy: 5 },
    }));

    const postRes = await request(app)
      .post('/api/v1/sensor-data')
      .send({ deviceId: device._id.toString(), tripId: trip._id.toString(), readings });

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.data.alarms.length).toBeGreaterThanOrEqual(1);
    expect(postRes.body.data.alarms[0].type).toBe('sudden_brake');

    const listRes = await request(app)
      .get('/api/v1/alarms')
      .query({ type: 'sudden_brake', deviceId: device._id.toString() });

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.data[0].type).toBe('sudden_brake');
  });

  test('POST /api/v1/sensor-data validation rejects malformed payloads with 422', async () => {
    const res = await request(app).post('/api/v1/sensor-data').send({ deviceId: 'x' });
    expect(res.statusCode).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/v1/sensor-data starts an active trip when tripId is omitted', async () => {
    const device = await Device.create({
      userId: new mongoose.Types.ObjectId(),
      label: 'Auto Trip Device',
      platform: 'android',
    });

    const start = Date.now();
    const readings = Array.from({ length: 12 }, (_, i) => ({
      ts: new Date(start + i * 20).toISOString(),
      accel: { x: 0.1, y: 0.1, z: 9.8 },
      gyro: { x: 0.0, y: 0.0, z: 0.1 },
      gps: { lat: 40, lng: 29, speed: 12, accuracy: 5 },
    }));

    const res = await request(app)
      .post('/api/v1/sensor-data')
      .send({ deviceId: device._id.toString(), readings });

    expect(res.statusCode).toBe(201);

    const trip = await Trip.findOne({ deviceId: device._id, status: 'active' });
    expect(trip).toBeTruthy();
    expect(trip.userId.toString()).toBe('000000000000000000000001');
  });
});
