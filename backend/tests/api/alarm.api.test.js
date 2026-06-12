process.env.AUTH_MODE = 'bypass';
process.env.JWT_SECRET = 'test_secret_123';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

jest.setTimeout(60000);

let mongoServer;
let mongoose;
let app;
let Alarm;
let Device;
let Trip;

async function setupMongoMemoryServer() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);

  Alarm = require('../../src/models/Alarm');
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

describe('Alarm API', () => {
  beforeAll(async () => {
    await setupMongoMemoryServer();
  });

  afterAll(async () => {
    await teardown();
  });

  let device, trip, alarm1, alarm2;

  beforeEach(async () => {
    await Alarm.deleteMany({});
    await Device.deleteMany({});
    await Trip.deleteMany({});

    device = await Device.create({
      userId: new mongoose.Types.ObjectId(),
      label: 'Test Device',
      platform: 'android',
    });

    trip = await Trip.create({
      deviceId: device._id,
      userId: device.userId,
      status: 'active',
    });

    alarm1 = await Alarm.create({
      deviceId: device._id,
      tripId: trip._id,
      type: 'sudden_brake',
      severity: 'high',
      value: -5.0,
      threshold: -4.0,
      unit: 'm/s2',
      windowStart: new Date(),
      windowEnd: new Date(),
    });

    alarm2 = await Alarm.create({
      deviceId: device._id,
      tripId: trip._id,
      type: 'sharp_turn',
      severity: 'medium',
      value: 3.5,
      threshold: 3.0,
      unit: 'm/s2',
      windowStart: new Date(),
      windowEnd: new Date(),
    });
  });

  test('GET /api/v1/alarms should return a list of alarms', async () => {
    const res = await request(app).get('/api/v1/alarms');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.some(a => a.type === 'sudden_brake')).toBe(true);
    expect(res.body.meta).toBeDefined();
  });

  test('GET /api/v1/alarms should filter by deviceId', async () => {
    const res = await request(app).get(`/api/v1/alarms?deviceId=${device._id.toString()}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test('GET /api/v1/alarms/:id should return a specific alarm', async () => {
    const res = await request(app).get(`/api/v1/alarms/${alarm1._id.toString()}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.type).toBe('sudden_brake');
    expect(res.body.data._id).toBe(alarm1._id.toString());
  });

  test('GET /api/v1/alarms/:id should return 404 for invalid ID format or not found', async () => {
    const randomId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/v1/alarms/${randomId.toString()}`);
    expect(res.statusCode).toBe(404);
  });
});
