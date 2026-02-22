const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.patch('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id, role FROM public.users WHERE user_id = $1 LIMIT 1', [req.user.user_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    const role = String(rows[0].role || '').toLowerCase();
    const payload = req.body || {};

    const allowedByRole = {
      student: ['username', 'class_group', 'level', 'email', 'password'],
      teacher: ['username', 'email', 'password'],
      admin: ['username', 'email', 'password'],
    };

    const allowed = new Set(allowedByRole[role] || []);
    const updates = [];
    const values = [];

    for (const field of Object.keys(payload)) {
      if (!allowed.has(field)) continue;
      if (field === 'password') continue;
      values.push(payload[field] || null);
      updates.push(`${field} = $${values.length}`);
    }

    if (allowed.has('password') && payload.password) {
      const hashed = await bcrypt.hash(String(payload.password), 10);
      values.push(hashed);
      updates.push(`password = $${values.length}`);
    }

    if (!updates.length) {
      const current = await db.query('SELECT user_id, username, student_id, role, class_group, level, email, advisor_id FROM public.users WHERE user_id = $1', [req.user.user_id]);
      return res.json({ success: true, user: current.rows[0] });
    }

    values.push(req.user.user_id);
    const query = `UPDATE public.users SET ${updates.join(', ')} WHERE user_id = $${values.length} RETURNING user_id, username, student_id, role, class_group, level, email, advisor_id`;
    const updated = await db.query(query, values);

    return res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    console.error('PATCH /api/profile/me', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;