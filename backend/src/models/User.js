const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Kullanıcı adı zorunludur'],
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Şifre zorunludur'],
    },
    role: {
      type: String,
      enum: ['admin', 'driver'],
      default: 'driver',
    },
  },
  { timestamps: true },
);

// Şifre doğrulama metodu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Kaydetmeden önce şifreyi hash'le
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);