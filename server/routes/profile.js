const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const ALLOWED_BY_ROLE = {
  student: ['username', 'student_id', 'class_group', 'level', 'email', 'password'],
  teacher: ['username', 'email', 'password'],
  admin: ['username', 'email', 'password'],
};

function normalizeString(val) {
  if (val === undefined) return undefined;
  if (val === null) return null;
  return String(val).trim();
}

function normalizeEmail(val) {
  if (val === undefined) return undefined;
  const s = String(val || '').trim();
  return s ? s : null;
}

function isValidEmail(email) {
  if (!email) return true; // allow null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ helper: โหลดโปรไฟล์ตัวเองแบบมีชื่ออาจารย์ที่ปรึกษาเสมอ
async function selectMeWithAdvisor(userId) {
  const { rows } = await db.query(
    `
    SELECT
      u.user_id,
      u.username,
      u.student_id,
      u.role,
      u.class_group,
      u.level,
      u.email,
      u.advisor_id,

      a.username AS advisor_name,
      a.email    AS advisor_email
    FROM public.users u
    LEFT JOIN public.users a
      ON a.user_id = u.advisor_id
    WHERE u.user_id = $1
    LIMIT 1
    `,
    [userId]
  );
  return rows[0] || null;
}

// =========================
// ✅ GET /api/profile/me
// =========================
router.get('/me', auth, async (req, res) => {
  try {
    const me = await selectMeWithAdvisor(req.user.user_id);
    if (!me) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    return res.json({ success: true, user: me });
  } catch (err) {
    console.error('GET /api/profile/me', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// =========================
// ✅ PATCH /api/profile/me
// =========================
router.patch('/me', auth, async (req, res) => {
  const userId = req.user.user_id;

  try {
    // 1) หา role ของตัวเอง
    const meQ = await db.query(
      'SELECT user_id, role FROM public.users WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    if (!meQ.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }

    const role = String(meQ.rows[0].role || '').toLowerCase();
    const payload = req.body || {};

    const allowed = new Set(ALLOWED_BY_ROLE[role] || []);
    if (!allowed.size) {
      return res.status(403).json({ success: false, message: 'ไม่อนุญาตให้แก้ไขโปรไฟล์ใน role นี้' });
    }

    // 2) normalize inputs
    const next = {};

    if (allowed.has('username') && payload.username !== undefined) {
      next.username = normalizeString(payload.username);
      if (!next.username) {
        return res.status(400).json({ success: false, message: 'กรุณากรอก Username' });
      }
    }

    if (allowed.has('student_id') && payload.student_id !== undefined) {
      next.student_id = normalizeString(payload.student_id);
      if (!next.student_id) {
        return res.status(400).json({ success: false, message: 'กรุณากรอก Student ID' });
      }
    }

    if (allowed.has('class_group') && payload.class_group !== undefined) {
      next.class_group = normalizeString(payload.class_group);
    }

    if (allowed.has('level') && payload.level !== undefined) {
      next.level = normalizeString(payload.level);
    }

    if (allowed.has('email') && payload.email !== undefined) {
      next.email = normalizeEmail(payload.email);
      if (!isValidEmail(next.email)) {
        return res.status(400).json({ success: false, message: 'อีเมลไม่ถูกต้อง' });
      }
    }

    // 3) uniqueness checks
    if (next.username !== undefined) {
      const u = await db.query(
        'SELECT 1 FROM public.users WHERE username = $1 AND user_id <> $2 LIMIT 1',
        [next.username, userId]
      );
      if (u.rows.length) {
        return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
      }
    }

    if (next.email !== undefined && next.email !== null) {
      const e = await db.query(
        'SELECT 1 FROM public.users WHERE email = $1 AND user_id <> $2 LIMIT 1',
        [next.email, userId]
      );
      if (e.rows.length) {
        return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้แล้ว' });
      }
    }

    // 4) build update query
    const updates = [];
    const values = [];

    const add = (col, val) => {
      if (val === undefined) return;
      values.push(val);
      updates.push(`${col} = $${values.length}`);
    };

    add('username', next.username);
    add('student_id', next.student_id);
    add('class_group', next.class_group);
    add('level', next.level);
    add('email', next.email);

    // password (ถ้าส่งมา)
    if (allowed.has('password') && payload.password) {
      const pw = String(payload.password).trim();
      if (pw.length < 6) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      }
      const hashed = await bcrypt.hash(pw, 10);
      values.push(hashed);
      updates.push(`password = $${values.length}`);
    }

    // ถ้าไม่มี field ให้ update -> ส่งข้อมูลปัจจุบันกลับ
    if (!updates.length) {
      const current = await selectMeWithAdvisor(userId);
      return res.json({ success: true, user: current });
    }

    values.push(userId);
    const query = `
      UPDATE public.users
      SET ${updates.join(', ')}
      WHERE user_id = $${values.length}
      RETURNING user_id
    `;

    await db.query(query, values);

    // 5) ส่งกลับข้อมูลล่าสุด (พร้อม advisor_name/advisor_email)
    const updatedUser = await selectMeWithAdvisor(userId);
    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('PATCH /api/profile/me', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;