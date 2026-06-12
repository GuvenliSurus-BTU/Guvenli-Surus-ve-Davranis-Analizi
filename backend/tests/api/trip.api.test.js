process.env.AUTH_MODE = 'bypass';
process.env.JWT_SECRET = 'test_secret_123';
process.env.NODE_ENV = 'test';

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

describe('Trip API', () => {
  beforeAll(async () => {
    await setupMongoMemoryServer();
  });

  afterAll(async () => {
    await teardown();
  });

  let device, trip1;

  beforeEach(async () => {
    await Device.deleteMany({});
    await Trip.deleteMany({});

    device = await Device.create({
      userId: new mongoose.Types.ObjectId('000000000000000000000001'), // Match DEMO_USER_ID from bypass
      label: 'Test Device for Trip',
      platform: 'ios',
    });

    trip1 = await Trip.create({
      deviceId: device._id,
      userId: device.userId,
      status: 'active',
      startTime: new Date(),
    });
  });

  test('POST /api/v1/trips/start should start a new trip or return active', async () => {
    const res = await request(app).post('/api/v1/trips/start').send({ deviceId: device._id.toString() });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.deviceId.toString()).toBe(device._id.toString());
  });

  test('POST /api/v1/trips/:id/end should end an active trip', async () => {
    const res = await request(app).post(`/api/v1/trips/${trip1._id.toString()}/end`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('ended');
    expect(res.body.data.endedAt).toBeDefined();
  });

  test('GET /api/v1/trips should list trips', async () => {
    const res = await request(app).get('/api/v1/trips');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/v1/trips/:id should return a trip by ID', async () => {
    const res = await request(app).get(`/api/v1/trips/${trip1._id.toString()}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(trip1._id.toString());
  });
});
