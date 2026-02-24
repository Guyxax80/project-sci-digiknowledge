const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/student-codes/me
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { rows } = await db.query(
      'SELECT role, student_id FROM public.users WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }

    const user = rows[0];

    if (user.role !== 'student') {
      return res.json({
        success: true,
        eligible: false,
        message: 'บัญชีนี้ไม่ใช่นักศึกษา'
      });
    }

    if (!user.student_id) {
      return res.json({
        success: true,
        eligible: false,
        message: 'ยังไม่ได้กรอก Student ID'
      });
    }

    const check = await db.query(
      'SELECT student_code_id FROM public.student_codes WHERE student_id = $1 LIMIT 1',
      [user.student_id]
    );

    const eligible = check.rows.length > 0;

    return res.json({
      success: true,
      eligible,
      message: eligible
        ? 'Student ID ผ่านการอนุมัติแล้ว'
        : 'Student ID ยังไม่ผ่านการอนุมัติ'
    });

  } catch (err) {
    console.error('student-codes/me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;