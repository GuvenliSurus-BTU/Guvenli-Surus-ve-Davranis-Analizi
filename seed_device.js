const mongoose = require('mongoose');
const env = require('./backend/src/config/env');
const User = require('./backend/src/models/User');
const Device = require('./backend/src/models/Device');

mongoose.connect(env.MONGODB_URI || 'mongodb://127.0.0.1:27017/guvenli-surus')
  .then(async () => {
    console.log('DB connected, seeding device...');
    
    // Create a mock user if not exists
    let user = await User.findOne({ _id: '000000000000000000000001' });
    if (!user) {
        user = await User.create({
            _id: '000000000000000000000001',
            username: 'admin',
            role: 'admin'
        });
        console.log('Seeded admin user');
    }

    const exists = await Device.findOne({ _id: '000000000000000000000002' });
    if (!exists) {
      await Device.create({
        _id: '000000000000000000000002',
        userId: user._id,
        label: 'Mobil Cihaz 1',
        platform: 'android',
        model: 'Generic Android',
        appVersion: '1.0.0'
      });
      console.log('Seeded mobile-device-01 (000000000000000000000002)');
    } else {
      console.log('Device already exists, updating schema...');
      await Device.updateOne({ _id: '000000000000000000000002' }, {
        $set: {
            userId: user._id,
            label: 'Mobil Cihaz 1',
            platform: 'android',
            model: 'Generic Android',
            appVersion: '1.0.0'
        }
      });
      console.log('Updated existing device schema');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
