const express = require('express');
const router = express.Router();
const db = require('../db');

const normalizeStatus = (status) => {
  if (status === 'published') return 'pending';
  if (!status) return 'draft';
  return status;
};

const baseListSql = `
  SELECT
    d.document_id, d.title, d.keywords, d.academic_year, d.uploaded_at, d.status, d.user_id,
    COALESCE(d.download_count, 0) AS download_count,
    COALESCE(cat.category_names, '') AS category_names
  FROM public.documents d
  LEFT JOIN (
    SELECT dc.document_id,
           STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) AS category_names
    FROM public.document_categories dc
    JOIN public.categories c ON c.categorie_id = dc.categorie_id
    GROUP BY dc.document_id
  ) cat ON cat.document_id = d.document_id
`;

router.get('/', async (_req, res) => {
  try {
    const { rows } = await db.query(`${baseListSql} WHERE COALESCE(LOWER(d.status::text), '') <> 'draft' ORDER BY d.uploaded_at DESC`);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/documents/recommended:", err.code, err.message);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้" });
  }
});

router.get('/test', (_req, res) => res.json({ message: 'API is working', timestamp: new Date().toISOString() }));

router.get('/recommended', async (_req, res) => {
  try {
    const { rows } = await db.query(`${baseListSql} WHERE COALESCE(LOWER(d.status::text), '') <> 'draft' ORDER BY download_count DESC, d.uploaded_at DESC LIMIT 6`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

router.get('/by-user/:userId', async (req, res) => {
  try {
    const { rows } = await db.query(`${baseListSql} WHERE d.user_id = $1 ORDER BY d.uploaded_at DESC`, [req.params.userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/supabase-health
router.get('/supabase-health', async (_req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await sb.storage.from('documents').list('', { limit: 1 });

    return res.json({
      ok: !error,
      url,
      hasServiceKey: !!key,
      error: error ? (error.message || error) : null,
      count: Array.isArray(data) ? data.length : null,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: String(e?.message || e) });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const documentId = req.params.id;
    const requesterUserId = req.body?.user_id;
    const { rows } = await db.query('SELECT user_id, status FROM documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
    const doc = rows[0];
    if (requesterUserId && Number(requesterUserId) !== Number(doc.user_id)) return res.status(403).json({ message: 'ไม่มีสิทธิ์เผยแพร่เอกสารนี้' });
    if (doc.status === 'pending') return res.json({ success: true, message: 'เอกสารถูกส่งเผยแพร่แล้ว' });

    await db.query('UPDATE documents SET status = $1 WHERE document_id = $2', [normalizeStatus('published'), documentId]);
    res.json({ success: true, message: 'ส่งเอกสารเพื่อเผยแพร่สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    const docRes = await db.query('SELECT * FROM documents WHERE document_id = $1', [documentId]);
    if (!docRes.rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });

    const catRes = await db.query(
      'SELECT c.categorie_id, c.name FROM document_categories dc JOIN categories c ON c.categorie_id = dc.categorie_id WHERE dc.document_id = $1 ORDER BY c.name ASC',
      [documentId],
    );
    const fileRes = await db.query('SELECT * FROM document_files WHERE document_id = $1 ORDER BY document_file_id ASC', [documentId]);

    const downloadFiles = [];
    let videoFile = null;
    for (const file of fileRes.rows) {
      if (file.file_type?.startsWith('video/') || file.section === 'presentation_video') {
        videoFile = { document_file_id: file.document_file_id, file_path: file.file_path, section: file.section || 'presentation_video' };
      } else {
        downloadFiles.push({ document_file_id: file.document_file_id, file_path: file.file_path, section: file.section || 'main', original_name: file.original_name || 'file' });
      }
    }

    res.json({ document: docRes.rows[0], categories: catRes.rows, videoFile, downloadFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

router.get("/:id/categories", async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT c.categorie_id, c.name
      FROM document_categories dc
      JOIN categories c ON c.categorie_id = dc.categorie_id
      WHERE dc.document_id = $1
      ORDER BY c.name ASC
      `,
      [req.params.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("DB error (document categories):", err);
    return res.status(500).json({ message: "ดึงหมวดหมู่ไม่สำเร็จ" });
  }
});

module.exports = router;