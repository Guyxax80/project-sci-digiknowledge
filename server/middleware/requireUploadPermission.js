const db = require('../db');

module.exports = async function requireUploadPermission(req, res, next) {
  const userId = req.user?.user_id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'กรุณา login' });
  }

  try {
    const { rows } = await db.query(
      `SELECT user_id, role, student_id
       FROM public.users
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
    }

    const user = rows[0];
    if (String(user.role || '').toLowerCase() !== 'student') {
      return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะนักศึกษา' });
    }

    if (!user.student_id) {
      return res.status(403).json({ success: false, message: 'ยังไม่ได้กรอก Student ID' });
    }

    const verified = await db.query(
      'SELECT 1 FROM public.student_codes WHERE student_id = $1 LIMIT 1',
      [user.student_id],
    );

    if (!verified.rows.length) {
      return res.status(403).json({ success: false, message: 'Student ID ยังไม่ผ่านการอนุมัติ (ไม่พบใน student_codes)' });
    }

    req.user.student_id = user.student_id;
    return next();
  } catch (err) {
    console.error('requireUploadPermission error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};