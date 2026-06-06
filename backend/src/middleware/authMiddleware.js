const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Token'dan user'ı bul, password hariç
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token süresi dolmuş, lütfen tekrar giriş yapın' });
      }
      return res.status(401).json({ message: 'Yetkisiz erişim, geçersiz token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı, yetkisiz erişim' });
  }
};

// Sadece admin erişimi için
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin yetkisi gereklidir' });
  }
};

module.exports = { protect, admin };