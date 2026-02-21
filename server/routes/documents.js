const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { notifyByEmail } = require('../services/notificationService');

const advisorRoles = new Set(['teacher', 'admin']);

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
    const { rows } = await db.query(`${baseListSql} WHERE LOWER(COALESCE(d.status::text, 'draft')) = 'published' ORDER BY d.uploaded_at DESC`);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/documents:', err.code, err.message);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

router.get('/test', (_req, res) => res.json({ message: 'API is working', timestamp: new Date().toISOString() }));

router.get('/recommended', async (_req, res) => {
  try {
    const { rows } = await db.query(`${baseListSql} WHERE LOWER(COALESCE(d.status::text, 'draft')) = 'published' ORDER BY download_count DESC, d.uploaded_at DESC LIMIT 6`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

router.get('/by-user/:userId', auth, async (req, res) => {
  if (Number(req.user.user_id) !== Number(req.params.userId) && !advisorRoles.has(String(req.user.role || '').toLowerCase())) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูข้อมูลนี้' });
  }

  try {
    const { rows } = await db.query(`${baseListSql} WHERE d.user_id = $1 ORDER BY d.uploaded_at DESC`, [req.params.userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

router.post('/:id/submit', auth, async (req, res) => {
  const documentId = Number(req.params.id);

  try {
    const { rows } = await db.query(
      `SELECT d.document_id, d.user_id, d.title, d.status
       FROM public.documents d
       WHERE d.document_id = $1
       LIMIT 1`,
      [documentId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const doc = rows[0];
    if (Number(doc.user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ส่งเอกสารนี้' });
    }

    const status = String(doc.status || '').toLowerCase();
    if (!['draft', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'ส่งได้เฉพาะ draft หรือ rejected' });
    }

    await db.query(`UPDATE public.documents SET status = 'pending' WHERE document_id = $1`, [documentId]);

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/document-detail/${documentId}`;
    const advisorUsers = await db.query(`SELECT user_id FROM public.users WHERE LOWER(role::text) IN ('teacher','admin')`);
    await Promise.all(advisorUsers.rows.map((u) => notifyByEmail({
      userId: u.user_id,
      documentId,
      subject: 'นักศึกษาส่งผลงานใหม่เข้าระบบแล้ว',
      message: `มีการส่งผลงานใหม่: "${doc.title}"\nดูรายละเอียด: ${link}`,
    })));

    return res.json({ success: true, message: 'ส่งเอกสารให้ที่ปรึกษาแล้ว' });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/:id/timeline', auth, async (req, res) => {
  try {
    const documentId = Number(req.params.id);
    const docQ = await db.query('SELECT user_id FROM public.documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!docQ.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const ownerId = Number(docQ.rows[0].user_id);
    const isOwner = ownerId === Number(req.user.user_id);
    const isAdvisor = advisorRoles.has(String(req.user.role || '').toLowerCase());
    if (!isOwner && !isAdvisor) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    const { rows } = await db.query(
      `SELECT ah.approval_id, ah.document_id, ah.status, ah.reason, ah.approved_at,
              ah.approver_id, u.username AS approver_name
       FROM public.approval_history ah
       JOIN public.users u ON u.user_id = ah.approver_id
       WHERE ah.document_id = $1
       ORDER BY ah.approved_at ASC`,
      [documentId]
    );

    return res.json(rows);
  } catch (err) {
    console.error('timeline error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const documentId = req.params.id;
    const docRes = await db.query('SELECT * FROM documents WHERE document_id = $1', [documentId]);
    if (!docRes.rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });

    const doc = docRes.rows[0];
    const isPublished = String(doc.status || '').toLowerCase() === 'published';
    const isOwner = Number(req.user?.user_id) === Number(doc.user_id);
    const isAdvisor = advisorRoles.has(String(req.user?.role || '').toLowerCase());
    if (!isPublished && !isOwner && !isAdvisor) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้' });
    }

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

    res.json({ document: doc, categories: catRes.rows, videoFile, downloadFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/:id/categories', async (req, res) => {
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
    console.error('DB error (document categories):', err);
    return res.status(500).json({ message: 'ดึงหมวดหมู่ไม่สำเร็จ' });
  }
});

module.exports = router;