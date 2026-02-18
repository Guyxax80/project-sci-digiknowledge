const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: 'JWT_SECRET not configured' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'กรุณา login' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'กรุณา login' });

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (_err) {
    res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง' });
  }
};