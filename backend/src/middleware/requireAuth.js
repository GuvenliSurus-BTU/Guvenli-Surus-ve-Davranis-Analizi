const env = require('../config/env');
const jwt = require('jsonwebtoken');

const DEMO_USER_ID = '000000000000000000000001';

function requireAuth(req, res, next) {
  if (env.AUTH_MODE === 'bypass') {
    req.user = { _id: DEMO_USER_ID, role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } });
  }

  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { _id: payload.userId, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
    }
    return next();
  };
}

module.exports = { requireAuth, authorize };
