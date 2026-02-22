const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { notifyByEmail } = require('../services/notificationService');

// ===== Roles =====
const advisorRoles = new Set(['teacher', 'admin']);

function roleOf(req) {
  return String(req.user?.role || '').trim().toLowerCase();
}
function isTeacher(req) {
  return roleOf(req) === 'teacher';
}
function isAdmin(req) {
  return roleOf(req) === 'admin';
}
function isAdvisor(req) {
  return advisorRoles.has(roleOf(req));
}

// ===== Status mapping (ตาม enum ของคุณ) =====
// public view = approved
const PUBLIC_STATUS = 'approved';

// ===== Required sections for SUBMIT (ต้องครบทุกอย่าง) =====
const REQUIRED_SECTIONS = [
  'cover',
  'abstract',
  'acknowledgement',
  'toc',
  'chapter1',
  'chapter2',
  'chapter3',
  'chapter4',
  'chapter5',
  'bibliography',
  'appendix',
  'author_bio',
  'presentation_video',
];

// ===== Base list SQL =====
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

// =======================================================
// PUBLIC LIST (เฉพาะ approved)
// =======================================================
router.get('/', async (_req, res) => {
  try {
    const { rows } = await db.query(
      `${baseListSql}
       WHERE LOWER(COALESCE(d.status::text, 'draft')) = $1
       ORDER BY d.uploaded_at DESC`,
      [PUBLIC_STATUS]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/documents:', err.code, err.message);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

router.get('/test', (_req, res) =>
  res.json({ message: 'API is working', timestamp: new Date().toISOString() })
);

router.get('/recommended', async (_req, res) => {
  try {
    const { rows } = await db.query(
      `${baseListSql}
       WHERE LOWER(COALESCE(d.status::text, 'draft')) = $1
       ORDER BY download_count DESC, d.uploaded_at DESC
       LIMIT 6`,
      [PUBLIC_STATUS]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// =======================================================
// BY USER
// - owner ดูได้
// - admin ดูได้ทุกคน
// - teacher ดูได้เฉพาะ student ที่ advisor_id = teacher.user_id
// =======================================================
router.get('/by-user/:userId', auth, async (req, res) => {
  const requesterId = Number(req.user.user_id);
  const targetUserId = Number(req.params.userId);

  if (requesterId === targetUserId) {
    // เจ้าของ
  } else if (isAdmin(req)) {
    // admin ดูได้ทุกคน
  } else if (isTeacher(req)) {
    // teacher ดูได้เฉพาะนักศึกษาที่ถูกผูก advisor_id = teacher
    try {
      const chk = await db.query(
        `SELECT 1
         FROM public.users
         WHERE user_id = $1
           AND role::text = 'student'
           AND advisor_id = $2
         LIMIT 1`,
        [targetUserId, requesterId]
      );
      if (!chk.rows.length) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูข้อมูลนี้' });
      }
    } catch (e) {
      console.error('by-user advisor check error:', e);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
  } else {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูข้อมูลนี้' });
  }

  try {
    const { rows } = await db.query(
      `${baseListSql} WHERE d.user_id = $1 ORDER BY d.uploaded_at DESC`,
      [targetUserId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// =======================================================
// SUBMIT
// - ส่งได้เฉพาะ owner และ status ต้องเป็น draft หรือ rejected
// - ต้องมีไฟล์ครบทุก section (REQUIRED_SECTIONS)
// - ส่งอีเมลหา "ที่ปรึกษาที่ถูกผูกไว้" เท่านั้น (role ต้องเป็น teacher)
// =======================================================
router.post('/:id/submit', auth, async (req, res) => {
  const documentId = Number(req.params.id);

  try {
    const docQ = await db.query(
      `SELECT d.document_id, d.user_id, d.title, d.status
       FROM public.documents d
       WHERE d.document_id = $1
       LIMIT 1`,
      [documentId]
    );
    if (!docQ.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const doc = docQ.rows[0];

    // ✅ ต้องเป็นเจ้าของเท่านั้น
    if (Number(doc.user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ส่งเอกสารนี้' });
    }

    const status = String(doc.status || '').toLowerCase();
    if (!['draft', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'ส่งได้เฉพาะ draft หรือ rejected' });
    }

    // ✅ 1) ตรวจไฟล์ครบทุก section
    const filesQ = await db.query(
      `SELECT DISTINCT COALESCE(NULLIF(section,''),'main') AS section
       FROM public.document_files
       WHERE document_id = $1`,
      [documentId]
    );
    const present = new Set(filesQ.rows.map(r => String(r.section || '').toLowerCase()));

    const missing = REQUIRED_SECTIONS.filter(s => !present.has(s));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาแนบไฟล์ให้ครบก่อนส่งให้ที่ปรึกษา',
        missing_sections: missing,
      });
    }

    // ✅ 2) หา advisor ที่ถูกผูกไว้ (ต้องเป็น teacher เท่านั้น)
    const stuQ = await db.query(
      `SELECT user_id, advisor_id
       FROM public.users
       WHERE user_id = $1 AND role::text = 'student'
       LIMIT 1`,
      [doc.user_id]
    );
    if (!stuQ.rows.length) {
      return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษาเจ้าของเอกสาร' });
    }

    const advisorId = stuQ.rows[0].advisor_id;
    if (!advisorId) {
      return res.status(400).json({
        success: false,
        message: 'ยังไม่ได้กำหนดที่ปรึกษา กรุณาให้แอดมินกำหนด advisor ก่อนส่ง',
      });
    }

    const advQ = await db.query(
      `SELECT user_id, role
       FROM public.users
       WHERE user_id = $1
       LIMIT 1`,
      [advisorId]
    );
    if (!advQ.rows.length) {
      return res.status(400).json({ success: false, message: 'ไม่พบอาจารย์ที่ปรึกษาที่ถูกกำหนด' });
    }
    const advRole = String(advQ.rows[0].role || '').toLowerCase();
    if (advRole !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'advisor ต้องเป็น teacher เท่านั้น (admin ไม่รับเป็นที่ปรึกษา)',
      });
    }

    // ✅ 3) เปลี่ยนสถานะเป็น pending
    await db.query(`UPDATE public.documents SET status = 'pending' WHERE document_id = $1`, [documentId]);

    // ✅ 4) แจ้งเตือน "เฉพาะ" ที่ปรึกษาที่ถูกผูกไว้
    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/document-detail/${documentId}`;
    await notifyByEmail({
      userId: advisorId,
      documentId,
      subject: 'นักศึกษาส่งผลงานให้ตรวจแล้ว',
      message: `มีการส่งผลงาน: "${doc.title}"\nดูรายละเอียด: ${link}`,
    });

    return res.json({ success: true, message: 'ส่งเอกสารให้ที่ปรึกษาแล้ว' });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// =======================================================
// TIMELINE (เหมือนเดิม)
// - owner ดูได้
// - teacher/admin ดูได้
// =======================================================
router.get('/:id/timeline', auth, async (req, res) => {
  try {
    const documentId = Number(req.params.id);
    const docQ = await db.query('SELECT user_id FROM public.documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!docQ.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const ownerId = Number(docQ.rows[0].user_id);
    const isOwner = ownerId === Number(req.user.user_id);

    // ✅ teacher/admin ยังเป็น advisor role ได้ แต่ teacher ต้องเป็นที่ปรึกษาของนักศึกษาคนนั้นเท่านั้น
    if (!isOwner) {
      if (isAdmin(req)) {
        // ok
      } else if (isTeacher(req)) {
        const chk = await db.query(
          `SELECT 1
           FROM public.users
           WHERE user_id = $1 AND advisor_id = $2
           LIMIT 1`,
          [ownerId, req.user.user_id]
        );
        if (!chk.rows.length) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
      } else {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
      }
    }

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

// =======================================================
// GET DOCUMENT DETAIL
// - ถ้า approved ทุกคนดูได้
// - ถ้าไม่ approved: owner ดูได้
//   - admin ดูได้
//   - teacher ดูได้เฉพาะเอกสารของนักศึกษาที่ advisor_id = teacher.user_id
// =======================================================
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const documentId = req.params.id;

    const docRes = await db.query('SELECT * FROM public.documents WHERE document_id = $1', [documentId]);
    if (!docRes.rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });

    const doc = docRes.rows[0];
    const status = String(doc.status || '').toLowerCase();
    const isPublic = status === PUBLIC_STATUS;

    const requesterId = Number(req.user?.user_id || 0);
    const ownerId = Number(doc.user_id || 0);
    const isOwner = requesterId && requesterId === ownerId;

    if (!isPublic && !isOwner) {
      if (isAdmin(req)) {
        // ok
      } else if (isTeacher(req)) {
        const chk = await db.query(
          `SELECT 1 FROM public.users WHERE user_id = $1 AND advisor_id = $2 LIMIT 1`,
          [ownerId, requesterId]
        );
        if (!chk.rows.length) {
          return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้' });
        }
      } else {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้' });
      }
    }

    const catRes = await db.query(
      `SELECT c.categorie_id, c.name
       FROM public.document_categories dc
       JOIN public.categories c ON c.categorie_id = dc.categorie_id
       WHERE dc.document_id = $1
       ORDER BY c.name ASC`,
      [documentId],
    );

    const fileRes = await db.query(
      'SELECT * FROM public.document_files WHERE document_id = $1 ORDER BY document_file_id ASC',
      [documentId]
    );

    const downloadFiles = [];
    let videoFile = null;

    for (const file of fileRes.rows) {
      const section = file.section || 'main';
      const isVideo = file.file_type?.startsWith('video/') || section === 'presentation_video';

      if (isVideo) {
        videoFile = {
          document_file_id: file.document_file_id,
          file_path: file.file_path,
          section,
          original_name: file.original_name || 'video',
        };
      } else {
        downloadFiles.push({
          document_file_id: file.document_file_id,
          file_path: file.file_path,
          section,
          original_name: file.original_name || 'file',
        });
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
      FROM public.document_categories dc
      JOIN public.categories c ON c.categorie_id = dc.categorie_id
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