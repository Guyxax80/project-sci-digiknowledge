const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'JWT_SECRET not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'กรุณา login' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = {
      user_id: payload.user_id,
      username: payload.username,
      role: payload.role,
    };
    next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง' });
  }
};