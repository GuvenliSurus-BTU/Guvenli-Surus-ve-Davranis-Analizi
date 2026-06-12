const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true },
    platform: { type: String, enum: ['android', 'ios'], required: true },
    model: String,
    appVersion: String,
    registeredAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Device', deviceSchema);
