const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  const { username, student_id, password, class_group, level } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });

  try {
    const existing = await db.query('SELECT user_id FROM users WHERE username = $1 LIMIT 1', [username]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });

    const hashedPassword = await bcrypt.hash(password, 10);
    let role = 'teacher';
    let validStudentId = null;

    if (student_id) {
      const studentRows = await db.query('SELECT student_id FROM student_codes WHERE student_id = $1 LIMIT 1', [student_id]);
      if (studentRows.rows.length > 0) {
        role = 'student';
        validStudentId = student_id;
      }
    }

    await db.query(
      'INSERT INTO users (username, student_id, password, role, class_group, level) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, validStudentId, hashedPassword, role, class_group || null, level || null],
    );

    res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ', role });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

module.exports = router;