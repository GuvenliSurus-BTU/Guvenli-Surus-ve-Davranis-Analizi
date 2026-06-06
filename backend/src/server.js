const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`✅ Sunucu ${PORT} portunda çalışıyor`);
      console.log(`📡 Ortam: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Sunucu başlatılamadı:', error.message);
    process.exit(1);
  }
};

startServer();