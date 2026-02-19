const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
    let role = 'user';
    let validStudentId = null;

    if (student_id && String(student_id).trim()) {
      const check = await db.query(
        'SELECT student_id FROM public.student_codes WHERE student_id = $1 LIMIT 1',
        [student_id]
      );

      if (check.rows.length > 0) {
        role = 'student';
        validStudentId = student_id;
      }
    }

    const inserted = await db.query(
      `INSERT INTO public.users (username, student_id, password, role, class_group, level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, role`,
      [username, validStudentId, hashedPassword, role, class_group || null, level || null]
    );

    const createdUser = inserted.rows[0];
    let token = null;
    if (process.env.JWT_SECRET) {
      token = jwt.sign(
        { user_id: createdUser.user_id, username: createdUser.username, role: createdUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    }

    return res.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      role: createdUser.role,
      userId: createdUser.user_id,
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
    if (String(err.message || '').includes('invalid input value for enum')) {
      return res.status(500).json({
        success: false,
        message: "ฐานข้อมูลยังไม่มี role 'user' ใน user_role_enum กรุณารัน migration ก่อน",
      });
    }
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

module.exports = router;