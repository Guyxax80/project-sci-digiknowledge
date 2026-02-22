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
    // 1) username ซ้ำไหม
    const existing = await db.query(
      'SELECT user_id FROM public.users WHERE username = $1 LIMIT 1',
      [username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
    }

    // 2) hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3) เก็บ student_id เสมอ (ถ้ามีส่งมา)
    const normalizedStudentId = (student_id && String(student_id).trim())
      ? String(student_id).trim()
      : null;

    // 4) คนที่สมัครแล้ว = student (ตามโมเดลใหม่ของคุณ)
    const role = 'student';

    // 5) เช็คสิทธิ์อัปโหลด/ส่งอนุมัติ (verified) แค่ “บอกสถานะ” ไม่ใช่เอาไปตัด student_id
    let isVerifiedStudent = false;
    if (normalizedStudentId) {
      const check = await db.query(
        'SELECT 1 FROM public.student_codes WHERE student_id = $1 LIMIT 1',
        [normalizedStudentId]
      );
      isVerifiedStudent = check.rows.length > 0;
    }

    // 6) insert user
    const inserted = await db.query(
      `INSERT INTO public.users (username, student_id, password, role, class_group, level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, role, student_id`,
      [username, normalizedStudentId, hashedPassword, role, class_group || null, level || null]
    );

    const createdUser = inserted.rows[0];

    // 7) token
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
      student_id: createdUser.student_id,
      isVerifiedStudent, // ✅ บอกเลยว่า "อัปโหลดได้ไหม"
      token,
    });

  } catch (err) {
    console.error('Signup error:', err);

    if (String(err.message || '').includes('invalid input value for enum')) {
      return res.status(500).json({
        success: false,
        message: "ฐานข้อมูล role enum ไม่รองรับค่า role ที่ส่งมา กรุณาตรวจ enum ใน DB",
      });
    }

    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

module.exports = router;