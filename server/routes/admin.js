const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/users', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id, username, role, student_id, created_at FROM users ORDER BY user_id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/users', async (req, res) => {
  const { username, password, role, student_id } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  if (role === 'student' && !student_id) return res.status(400).json({ error: 'กรุณาระบุ Student ID สำหรับนักศึกษา' });

  try {
    if (student_id) {
      const chk = await db.query('SELECT 1 FROM student_codes WHERE student_id = $1 LIMIT 1', [student_id]);
      if (!chk.rows.length) return res.status(400).json({ error: 'Student ID ไม่พบในระบบ' });
    }
    await db.query('INSERT INTO users (username, student_id, password, role) VALUES ($1, $2, $3, $4)', [username, student_id || null, password, role]);
    res.json({ message: 'เพิ่มผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB insert error' });
  }
});

router.put('/users/:user_id', async (req, res) => {
  const { username, role, student_id } = req.body;
  const userId = req.params.user_id;
  try {
    const current = await db.query('SELECT student_id FROM users WHERE user_id = $1 LIMIT 1', [userId]);
    if (!current.rows.length) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

    const targetStudentId = typeof student_id === 'undefined' ? current.rows[0].student_id : (student_id || null);
    if (role === 'student' && !targetStudentId) return res.status(400).json({ error: 'กรุณาระบุ Student ID สำหรับนักศึกษา' });

    if (targetStudentId) {
      await db.query('INSERT INTO student_codes (student_id) VALUES ($1) ON CONFLICT (student_id) DO NOTHING', [targetStudentId]);
    }

    await db.query('UPDATE users SET username = $1, role = $2, student_id = $3 WHERE user_id = $4', [username, role, targetStudentId, userId]);
    res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB update error' });
  }
});

router.delete('/users/:user_id', async (req, res) => {
  try {
    await db.query('UPDATE documents SET user_id = NULL WHERE user_id = $1', [req.params.user_id]);
    await db.query('DELETE FROM users WHERE user_id = $1', [req.params.user_id]);
    res.json({ message: 'ลบผู้ใช้สำเร็จ (ผลงานยังอยู่)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้ได้' });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const users = await db.query('SELECT COUNT(*)::int AS count FROM users');
    const documents = await db.query('SELECT COUNT(*)::int AS count FROM documents');
    const downloads = await db.query('SELECT COALESCE(SUM(download_count),0)::int AS count FROM documents');
    const usersByRole = await db.query('SELECT role, COUNT(*)::int AS count FROM users GROUP BY role');
    const topDocuments = await db.query('SELECT document_id, title, COALESCE(download_count,0) AS download_count FROM documents ORDER BY COALESCE(download_count,0) DESC, uploaded_at DESC LIMIT 20');
    const topFiles = await db.query('SELECT df.document_file_id, df.document_id, df.section, df.original_name, COALESCE(df.download_count,0) AS download_count, d.title FROM document_files df JOIN documents d ON d.document_id = df.document_id ORDER BY COALESCE(df.download_count,0) DESC LIMIT 20');

    res.json({
      users: users.rows[0].count,
      documents: documents.rows[0].count,
      downloads: downloads.rows[0].count,
      usersByRole: usersByRole.rows,
      topDocuments: topDocuments.rows,
      topFiles: topFiles.rows,
      topCategories: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/documents/:documentId/file-downloads', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT document_file_id, section, original_name, COALESCE(download_count,0) AS download_count FROM document_files WHERE document_id = $1 AND COALESCE(download_count,0) > 0 ORDER BY download_count DESC, document_file_id ASC',
      [req.params.documentId],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/backup', (_req, res) => {
  res.status(501).json({ error: 'Use Supabase backup tools / pg_dump outside API server.' });
});

router.get('/student-codes', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT student_code_id, student_id FROM student_codes ORDER BY student_code_id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/student-codes', async (req, res) => {
  const raw = req.body.student_ids;
  if (!raw) return res.status(400).json({ error: 'กรุณาระบุ Student ID' });
  const ids = (Array.isArray(raw) ? raw : String(raw).split(/[\n,]/)).map((s) => String(s).trim()).filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'ไม่มี Student ID ที่เพิ่มได้' });

  try {
    let inserted = 0;
    for (const id of ids) {
      const r = await db.query('INSERT INTO student_codes (student_id) VALUES ($1) ON CONFLICT (student_id) DO NOTHING RETURNING student_code_id', [id]);
      if (r.rows.length) inserted += 1;
    }
    res.json({ success: true, inserted, totalSubmitted: ids.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เพิ่มรหัสนักศึกษาไม่สำเร็จ' });
  }
});

router.delete('/student-codes/:student_code_id', async (req, res) => {
  try {
    await db.query('DELETE FROM student_codes WHERE student_code_id = $1', [req.params.student_code_id]);
    res.json({ success: true });
  } catch (_err) {
    res.status(500).json({ error: 'DB delete error' });
  }
});

module.exports = router;