const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  const { username, student_id, password, class_group, level } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  try {
    const existing = await db.query(
      'SELECT user_id FROM public.users WHERE username = $1 LIMIT 1',
      [username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ default: ผู้ใช้ธรรมดา
    let role = 'user';
    let validStudentId = null;

    // ✅ ถ้ามี student_id และตรวจเจอใน student_codes → เป็น student
    if (student_id && String(student_id).trim()) {
      const check = await db.query(
        'SELECT student_id FROM public.student_codes WHERE student_id = $1 LIMIT 1',
        [student_id]
      );

      if (check.rows.length > 0) {
        role = 'student';
        validStudentId = student_id;
      } else {
        // ถ้าอยาก “บังคับ” ว่ากรอกแล้วต้องถูก ไม่งั้นสมัครไม่ได้ → เปิดบรรทัดนี้
        // return res.status(400).json({ success: false, message: 'Student ID ไม่ถูกต้องหรือไม่อยู่ในระบบ' });

        // ถ้าไม่บังคับ ก็ปล่อยให้สมัครเป็น user ได้ แต่ไม่มีสิทธิ์อัปโหลด
        validStudentId = null;
      }
    }

    await db.query(
      `INSERT INTO public.users (username, student_id, password, role, class_group, level)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, validStudentId, hashedPassword, role, class_group || null, level || null]
    );

    return res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ', role });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

module.exports = router;