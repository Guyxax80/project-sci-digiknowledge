const db = require('../db');

module.exports = async function requireVerifiedStudent(req, res, next) {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
    }

    const { rows } = await db.query(
      'SELECT role, student_id FROM public.users WHERE user_id = $1 LIMIT 1',
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }

    const role = String(rows[0].role || '').toLowerCase();
    const student_id = rows[0].student_id ? String(rows[0].student_id).trim() : '';

    // สมัครแล้ว = student (ตามโมเดลใหม่)
    if (role !== 'student') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });
    }

    // ต้องมี student_id ก่อน
    if (!student_id) {
      return res.status(403).json({
        success: false,
        message: 'ยังไม่ได้กรอก Student ID',
      });
    }

    // ✅ ต้องอยู่ใน student_codes ถึงจะ "verified"
    const check = await db.query(
      'SELECT 1 FROM public.student_codes WHERE student_id = $1 LIMIT 1',
      [student_id]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Student ID ยังไม่ผ่านการอนุมัติ (ไม่พบใน student_codes)',
      });
    }

    return next();
  } catch (err) {
    console.error('requireVerifiedStudent error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};