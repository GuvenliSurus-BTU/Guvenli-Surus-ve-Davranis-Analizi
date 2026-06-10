require('dotenv').config();
const { connectDb, mongoose } = require('../src/config/db');
const User = require('../src/models/User');
const Device = require('../src/models/Device');
const Trip = require('../src/models/Trip');
const ThresholdConfig = require('../src/models/ThresholdConfig');
const Alarm = require('../src/models/Alarm');
const SensorReading = require('../src/models/SensorReading');
const AnalysisRun = require('../src/models/AnalysisRun');

async function seed() {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Device.deleteMany({}),
    Trip.deleteMany({}),
    ThresholdConfig.deleteMany({}),
    Alarm.deleteMany({}),
    SensorReading.deleteMany({}),
    AnalysisRun.deleteMany({}),
  ]);

  const [admin, driver] = await User.insertMany([
    { username: 'admin', role: 'admin', passwordHash: 'placeholder_hash' },
    { username: 'driver01', role: 'driver', passwordHash: 'placeholder_hash' },
  ]);

  const [device] = await Device.insertMany([
    {
      userId: driver._id,
      label: 'Driver Phone',
      platform: 'android',
      model: 'Pixel',
      appVersion: '1.0.0',
    },
  ]);

  await Trip.create({ deviceId: device._id, userId: driver._id, status: 'active' });

  await ThresholdConfig.create({ deviceId: device._id, updatedBy: admin._id, overrides: {} });

  console.log(JSON.stringify({ adminId: admin._id, driverId: driver._id, deviceId: device._id }, null, 2));
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
