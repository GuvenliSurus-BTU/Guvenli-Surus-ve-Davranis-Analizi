const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    status: { type: String, enum: ['active', 'ended'], default: 'active', index: true },
    summary: {
      totalAlarms: { type: Number, default: 0 },
      alarmByType: { type: Map, of: Number },
      averageSpeedMs: Number,
    },
  },
  { timestamps: true },
);

tripSchema.index({ deviceId: 1, startedAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
