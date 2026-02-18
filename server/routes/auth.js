const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!JWT_SECRET) return res.status(500).json({ success: false, message: 'JWT_SECRET not configured' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token invalid or expired' });
    req.user = user;
    next();
  });
}

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT user_id, username, student_id, role, created_at, class_group, level FROM users WHERE user_id = $1',
      [req.user.user_id],
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อผู้ใช้' });

  try {
    const users = await db.query('SELECT user_id FROM users WHERE username = $1 OR student_id = $2 LIMIT 1', [username, username]);
    if (!users.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    const userId = users.rows[0].user_id;
    const token = `${Math.floor(100000 + Math.random() * 900000)}`;
    await db.query(`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`, [userId, token]);
    res.json({ success: true, message: 'ส่งรหัสรีเซ็ตสำเร็จ', code: token });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { username, code, new_password } = req.body || {};
  if (!username || !code || !new_password) return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบ' });

  try {
    const users = await db.query('SELECT user_id FROM users WHERE username = $1 LIMIT 1', [username]);
    if (!users.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    const userId = users.rows[0].user_id;
    const tokens = await db.query(
      'SELECT token_id, expires_at FROM password_reset_tokens WHERE user_id = $1 AND token = $2 ORDER BY token_id DESC LIMIT 1',
      [userId, code],
    );
    if (!tokens.rows.length) return res.status(400).json({ success: false, message: 'รหัสไม่ถูกต้อง' });
    if (Date.now() > new Date(tokens.rows[0].expires_at).getTime()) return res.status(400).json({ success: false, message: 'รหัสหมดอายุ' });

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashed, userId]);
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    res.json({ success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;