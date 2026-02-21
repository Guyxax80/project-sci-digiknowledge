const jwt = require('jsonwebtoken');

module.exports = function optionalAuth(req, _res, next) {
  const secret = process.env.JWT_SECRET;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!secret || !token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = {
      user_id: payload.user_id,
      username: payload.username,
      role: payload.role,
    };
  } catch (_err) {
    req.user = null;
  }

  return next();
};