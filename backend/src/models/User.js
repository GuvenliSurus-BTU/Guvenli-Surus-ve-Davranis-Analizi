const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, default: 'placeholder_hash' },
    role: { type: String, enum: ['admin', 'driver'], default: 'driver' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
