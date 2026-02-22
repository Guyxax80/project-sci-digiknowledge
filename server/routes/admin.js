const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt'); // ✅ เพิ่มให้ครบ

// =========================
// helpers: check columns exists (กันพังถ้ายังไม่มีคอลัมน์)
// =========================
async function getExistingColumns(tableName, wantedCols) {
  const { rows } = await db.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name=$1
      AND column_name = ANY($2::text[])
    `,
    [tableName, wantedCols]
  );
  const set = new Set(rows.map(r => r.column_name));
  return wantedCols.filter(c => set.has(c));
}

async function ensureUsersHasAdvisorId() {
  const cols = await getExistingColumns('users', ['advisor_id']);
  return cols.includes('advisor_id');
}

// =========================
// USERS
// =========================
router.get('/users', async (_req, res) => {
  try {
    // อยากได้ fields เพิ่ม แต่ถ้าไม่มีคอลัมน์ก็ไม่พัง
    const existing = await getExistingColumns('users', [
      'email',
      'class_group',
      'level',
      'advisor_id',
      'created_at',
    ]);

    const selectParts = [
      'user_id',
      'username',
      'role',
      'student_id',
      existing.includes('email') ? 'email' : 'NULL::text AS email',
      existing.includes('class_group') ? 'class_group' : 'NULL::text AS class_group',
      existing.includes('level') ? 'level' : 'NULL::text AS level',
      existing.includes('advisor_id') ? 'advisor_id' : 'NULL::int AS advisor_id',
      existing.includes('created_at') ? 'created_at' : 'NOW() AS created_at',
    ];

    const { rows } = await db.query(
      `SELECT ${selectParts.join(', ')} FROM users ORDER BY user_id DESC`
    );
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

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, student_id, password, role) VALUES ($1, $2, $3, $4)',
      [username, student_id || null, hashed, role]
    );

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

    const targetStudentId =
      typeof student_id === 'undefined' ? current.rows[0].student_id : (student_id || null);

    if (role === 'student' && !targetStudentId)
      return res.status(400).json({ error: 'กรุณาระบุ Student ID สำหรับนักศึกษา' });

    if (targetStudentId) {
      await db.query(
        'INSERT INTO student_codes (student_id) VALUES ($1) ON CONFLICT (student_id) DO NOTHING',
        [targetStudentId]
      );
    }

    await db.query(
      'UPDATE users SET username = $1, role = $2, student_id = $3 WHERE user_id = $4',
      [username, role, targetStudentId, userId]
    );

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

// =========================
// ✅ ADVISOR: teachers/students + set advisor
// =========================

// GET /api/admin/teachers
router.get('/teachers', async (_req, res) => {
  try {
    const existing = await getExistingColumns('users', ['email']);
    const selectParts = [
      'user_id',
      'username',
      'role',
      existing.includes('email') ? 'email' : 'NULL::text AS email',
    ];

    const { rows } = await db.query(
      `SELECT ${selectParts.join(', ')}
       FROM users
       WHERE role='teacher'
       ORDER BY user_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('admin/teachers error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/admin/students
router.get('/students', async (_req, res) => {
  try {
    const existing = await getExistingColumns('users', [
      'email',
      'class_group',
      'level',
      'advisor_id',
    ]);

    const selectParts = [
      'user_id',
      'username',
      'role',
      'student_id',
      existing.includes('email') ? 'email' : 'NULL::text AS email',
      existing.includes('class_group') ? 'class_group' : 'NULL::text AS class_group',
      existing.includes('level') ? 'level' : 'NULL::text AS level',
      existing.includes('advisor_id') ? 'advisor_id' : 'NULL::int AS advisor_id',
    ];

    const { rows } = await db.query(
      `SELECT ${selectParts.join(', ')}
       FROM users
       WHERE role='student'
       ORDER BY user_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('admin/students error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// PUT /api/admin/students/:id/advisor  { advisor_id }
router.put('/students/:id/advisor', async (req, res) => {
  try {
    const studentUserId = Number(req.params.id);
    const { advisor_id } = req.body;

    if (!advisor_id) return res.status(400).json({ error: 'advisor_id required' });

    // ✅ กันพังถ้ายังไม่มีคอลัมน์ advisor_id
    const hasAdvisorId = await ensureUsersHasAdvisorId();
    if (!hasAdvisorId) {
      return res.status(400).json({
        error:
          "ตาราง users ยังไม่มีคอลัมน์ advisor_id กรุณารัน SQL: ALTER TABLE public.users ADD COLUMN advisor_id integer;",
      });
    }

    // เช็คว่า student มีจริงและเป็น role student
    const stu = await db.query(
      `SELECT user_id FROM users WHERE user_id=$1 AND role='student' LIMIT 1`,
      [studentUserId]
    );
    if (!stu.rows.length) return res.status(404).json({ error: 'ไม่พบนักศึกษา' });

    // เช็คว่า advisor เป็น teacher จริง
    const t = await db.query(
      `SELECT user_id FROM users WHERE user_id=$1 AND role='teacher' LIMIT 1`,
      [advisor_id]
    );
    if (!t.rows.length) return res.status(400).json({ error: 'advisor ต้องเป็น teacher' });

    await db.query(
      `UPDATE users SET advisor_id=$1 WHERE user_id=$2`,
      [advisor_id, studentUserId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('admin set advisor error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// =========================
// STATS
// =========================
router.get('/stats', async (req, res) => {
  const days = Math.max(1, Math.min(Number(req.query.days || 7), 365));

  try {
    // ----- Core totals -----
    const usersQ = await db.query('SELECT COUNT(*)::int AS count FROM users');
    const documentsQ = await db.query('SELECT COUNT(*)::int AS count FROM documents');
    const downloadsQ = await db.query('SELECT COALESCE(SUM(download_count),0)::int AS count FROM documents');
    const usersByRoleQ = await db.query('SELECT role, COUNT(*)::int AS count FROM users GROUP BY role');

    // ----- Detect timestamp column (uploaded_at preferred) -----
    const tsColQ = await db.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name='documents'
        AND column_name IN ('uploaded_at','created_at')
      ORDER BY CASE column_name WHEN 'uploaded_at' THEN 0 ELSE 1 END
      LIMIT 1
      `
    );
    const tsCol = tsColQ.rows?.[0]?.column_name || 'uploaded_at';

    // ----- Upload count in last N days -----
    const uploadCountQ = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM documents
       WHERE ${tsCol} >= NOW() - ($1 || ' days')::interval`,
      [days]
    );

    // ----- Daily series in last N days (fill missing days) -----
    const uploadsSeriesQ = await db.query(
      `
      WITH dd AS (
        SELECT generate_series(
          date_trunc('day', NOW()) - ($1::int - 1) * interval '1 day',
          date_trunc('day', NOW()),
          interval '1 day'
        ) AS day
      )
      SELECT to_char(dd.day, 'YYYY-MM-DD') AS date,
             COALESCE(COUNT(d.document_id), 0)::int AS count
      FROM dd
      LEFT JOIN documents d
        ON date_trunc('day', d.${tsCol}) = dd.day
      GROUP BY 1
      ORDER BY 1
      `,
      [days]
    );

    // ----- topCategories (ตรงกับ schema คุณ) -----
    let topCategoriesRows = [];
    try {
      const hasCategoriesTableQ = await db.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='categories' LIMIT 1`
      );
      const hasJoinTableQ = await db.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='document_categories' LIMIT 1`
      );

      if (hasCategoriesTableQ.rows.length && hasJoinTableQ.rows.length) {
        const topCategoriesQ = await db.query(
          `
          SELECT
            c.categorie_id AS category_id,
            c.name AS category_name,
            COUNT(dc.document_id)::int AS count
          FROM document_categories dc
          JOIN categories c
            ON c.categorie_id = dc.categorie_id
          JOIN documents d
            ON d.document_id = dc.document_id
          WHERE d.${tsCol} >= NOW() - ($1 || ' days')::interval
          GROUP BY c.categorie_id, c.name
          ORDER BY count DESC
          LIMIT 5
          `,
          [days]
        );
        topCategoriesRows = topCategoriesQ.rows;
      }
    } catch (e) {
      console.error('topCategories error:', e);
      topCategoriesRows = [];
    }

    // ----- Top downloads -----
    const topDocumentsQ = await db.query(
      `
      SELECT document_id, title, COALESCE(download_count,0)::int AS download_count
      FROM documents
      ORDER BY COALESCE(download_count,0) DESC, ${tsCol} DESC
      LIMIT 20
      `
    );

    const topFilesQ = await db.query(
      `
      SELECT df.document_file_id, df.document_id, df.section, df.original_name,
             COALESCE(df.download_count,0)::int AS download_count,
             d.title
      FROM document_files df
      JOIN documents d ON d.document_id = df.document_id
      ORDER BY COALESCE(df.download_count,0) DESC
      LIMIT 20
      `
    );

    res.json({
      users: usersQ.rows[0].count,
      documents: documentsQ.rows[0].count,
      downloads: downloadsQ.rows[0].count,
      usersByRole: usersByRoleQ.rows,

      days,
      tsCol,
      uploadCount7d: uploadCountQ.rows[0].count,
      uploads7dSeries: uploadsSeriesQ.rows,
      topCategories: topCategoriesRows,

      topDocuments: topDocumentsQ.rows,
      topFiles: topFilesQ.rows,
    });
  } catch (err) {
    console.error('admin stats error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// =========================
// FILE DOWNLOADS (per document)
// =========================
router.get('/documents/:documentId/file-downloads', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT document_file_id, section, original_name, COALESCE(download_count,0) AS download_count
       FROM document_files
       WHERE document_id = $1 AND COALESCE(download_count,0) > 0
       ORDER BY download_count DESC, document_file_id ASC`,
      [req.params.documentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// =========================
// BACKUP
// =========================
router.get('/backup', (_req, res) => {
  res.status(501).json({ error: 'Use Supabase backup tools / pg_dump outside API server.' });
});

// =========================
// STUDENT CODES
// =========================
router.get('/student-codes', async (_req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT student_code_id, student_id FROM student_codes ORDER BY student_code_id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/student-codes', async (req, res) => {
  const raw = req.body.student_ids;
  if (!raw) return res.status(400).json({ error: 'กรุณาระบุ Student ID' });

  const ids = (Array.isArray(raw) ? raw : String(raw).split(/[\n,]/))
    .map((s) => String(s).trim())
    .filter(Boolean);

  if (!ids.length) return res.status(400).json({ error: 'ไม่มี Student ID ที่เพิ่มได้' });

  try {
    let inserted = 0;
    for (const id of ids) {
      const r = await db.query(
        'INSERT INTO student_codes (student_id) VALUES ($1) ON CONFLICT (student_id) DO NOTHING RETURNING student_code_id',
        [id]
      );
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