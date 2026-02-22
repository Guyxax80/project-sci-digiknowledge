const db = require('../db');

module.exports = async function requireVerifiedStudent(req, res, next) {
  try {
    // ต้อง login ก่อน (req.user ต้องมาจาก auth middleware ของคุณ)
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
    }

    // ดึง student_id จาก users
    const { rows } = await db.query(
      'SELECT role, student_id FROM public.users WHERE user_id = $1 LIMIT 1',
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }

    const { role, student_id } = rows[0];

    if (role !== 'student') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });
    }

    if (!student_id) {
      return res.status(403).json({
        success: false,
        message: 'ยังไม่มี student_id กรุณาให้แอดมินเพิ่มข้อมูล',
      });
    }

    const check = await db.query(
      'SELECT 1 FROM public.student_codes WHERE student_id = $1 LIMIT 1',
      [student_id]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'student_id ยังไม่ผ่านการอนุมัติ (ไม่พบใน student_codes)',
      });
    }

    next();
  } catch (err) {
    console.error('requireVerifiedStudent error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};