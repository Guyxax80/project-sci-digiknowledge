const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: 'JWT_SECRET not configured' });

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'กรุณา login' });

  jwt.verify(token, secret, (err, payload) => {
    if (err) return res.status(403).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });

    req.user = { id: payload.user_id, username: payload.username, role: payload.role };
    next();
  });
}

module.exports = authenticateToken;