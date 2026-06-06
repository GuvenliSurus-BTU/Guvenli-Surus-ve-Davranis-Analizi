const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const sensorRoutes = require('./routes/sensorRoutes');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '5mb' }));  // Toplu sensör verisi için limit artırıldı
app.use(express.urlencoded({ extended: true }));

// ─── Sağlık kontrolü ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Route'ları ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);

// ─── Hata Handler'ları ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;