const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    type: {
      type: String,
      enum: ['sudden_brake', 'sudden_acceleration', 'sharp_turn', 'excessive_jolt'],
      required: true,
      index: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    value: { type: Number, required: true },
    threshold: { type: Number, required: true },
    unit: { type: String, required: true },
    windowStart: { type: Date, required: true },
    windowEnd: { type: Date, required: true },
    gps: {
      lat: Number,
      lng: Number,
    },
    evidence: { type: Object },
  },
  { timestamps: true },
);

alarmSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model('Alarm', alarmSchema);
