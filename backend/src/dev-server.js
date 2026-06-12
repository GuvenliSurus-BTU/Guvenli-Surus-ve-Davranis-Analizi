require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  console.log('Starting MongoDB Memory Server (No Docker needed)...');
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  console.log('✅ MongoDB Memory Server is running at', process.env.MONGODB_URI);
  
  // Require after setting the env variable so env.js reads the dynamic URI
  const { bootstrap } = require('./server');
  await bootstrap();

  // Seed default test device
  const mongoose = require('mongoose');
  const Device = require('./models/Device');
  await Device.create({
    _id: '000000000000000000000002',
    label: 'Test Cihazı (Mobil Uygulama)',
    platform: 'android',
    userId: '000000000000000000000001',
    model: 'Pixel Emulator',
    appVersion: '1.0.0'
  });
  console.log('✅ Seeded default test device 000000000000000000000002');
}

run().catch(console.error);
