module.exports = function requireRole(role) {
  return (req, res, next) => {
    const currentRole = String(req.user?.role || '').toLowerCase();
    if (!currentRole) {
      return res.status(401).json({ success: false, message: 'กรุณา login' });
    }

    if (currentRole !== String(role).toLowerCase()) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });
    }

    return next();
  };
};