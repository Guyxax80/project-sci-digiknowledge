// routes/documents.js
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

// ===== helpers =====
function normalizeStatus(s) {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'approved') return 'approved';
  if (v === 'rejected') return 'rejected';
  if (v === 'pending') return 'pending';
  if (v === 'draft') return 'draft';
  return v || 'draft';
}

// กัน email timeout ไม่ให้ API ล้ม
async function safeNotify(payload) {
  try {
    await notifyByEmail(payload);
    return { ok: true };
  } catch (e) {
    console.error('[email] send failed (ignored)', {
      message: e?.message,
      code: e?.code,
      response: e?.response,
      hint: { userId: payload?.userId, documentId: payload?.documentId, subject: payload?.subject },
    });
    return { ok: false, error: e };
  }
}

function getClient() {
  const pool = db.pool || db;
  if (!pool?.connect) throw new Error('DB pool is not configured (missing connect())');
  return pool.connect();
}

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
// =======================================================
router.get('/by-user/:userId', auth, async (req, res) => {
  const requesterId = Number(req.user.user_id);
  const targetUserId = Number(req.params.userId);

  if (requesterId === targetUserId) {
    // owner
  } else if (isAdmin(req)) {
    // admin
  } else if (isTeacher(req)) {
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
// ✅ ADD / UPDATE SECTION FILE METADATA (แก้ 404 ของคุณ)
// POST /api/documents/:id/sections
//
// ใช้กรณีที่ frontend อัปโหลดไฟล์ไป storage แล้ว (Supabase/Cloudinary)
// แล้วส่ง file_path มาให้ backend บันทึกลง document_files
//
// หมายเหตุ: ถ้าคุณส่งไฟล์จริง (multipart) แนะนำให้ใช้ /api/section-files แทน
// =======================================================
router.post('/:id/sections', auth, async (req, res) => {
  try {
    const documentId = Number(req.params.id);
    if (!Number.isFinite(documentId) || documentId <= 0) {
      return res.status(400).json({ success: false, message: 'documentId ไม่ถูกต้อง' });
    }

    // ✅ ตรวจว่าเอกสารมีอยู่ และเป็นเจ้าของ (หรือ admin/teacher ตามที่คุณต้องการ)
    const docQ = await db.query(
      `SELECT document_id, user_id, status
       FROM public.documents
       WHERE document_id = $1
       LIMIT 1`,
      [documentId]
    );
    if (!docQ.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
    }

    const doc = docQ.rows[0];
    const requesterId = Number(req.user.user_id);
    const ownerId = Number(doc.user_id);

    // owner เท่านั้น (ถ้าคุณอยากให้ teacher/admin ทำได้ด้วย ค่อยขยาย)
    if (requesterId !== ownerId && !isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    // ✅ รับข้อมูลจาก frontend (ปรับ field ตามที่คุณส่งจริง)
    const section = String(req.body.section || '').trim();
    const file_path = String(req.body.file_path || '').trim();
    const original_name = String(req.body.original_name || '').trim();
    const file_type = String(req.body.file_type || '').trim();

    if (!section) {
      return res.status(400).json({ success: false, message: 'ต้องระบุ section' });
    }
    if (!file_path) {
      return res.status(400).json({
        success: false,
        message:
          'ต้องส่ง file_path (ถ้าคุณอัปโหลดไฟล์จริง ให้ใช้ endpoint /api/section-files)',
      });
    }

    // ✅ กัน section แปลก ๆ (optional) — ถ้าคุณอยากให้เฉพาะชุดนี้เท่านั้น
    // const allowed = new Set(REQUIRED_SECTIONS);
    // if (!allowed.has(section)) {
    //   return res.status(400).json({ success: false, message: 'section ไม่ถูกต้อง' });
    // }

    // ✅ ถ้ามี section เดิมอยู่แล้ว ให้ update แทน insert (กันซ้ำ)
    const existing = await db.query(
      `SELECT document_file_id
       FROM public.document_files
       WHERE document_id = $1 AND LOWER(COALESCE(section,'')) = LOWER($2)
       LIMIT 1`,
      [documentId, section]
    );

    let saved;
    if (existing.rows.length) {
      const documentFileId = existing.rows[0].document_file_id;
      const up = await db.query(
        `UPDATE public.document_files
         SET file_path = $1,
             original_name = $2,
             file_type = $3,
             uploaded_at = NOW()
         WHERE document_file_id = $4
         RETURNING *`,
        [file_path, original_name || null, file_type || null, documentFileId]
      );
      saved = up.rows[0];
    } else {
      const ins = await db.query(
        `INSERT INTO public.document_files (document_id, file_path, original_name, file_type, section, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [documentId, file_path, original_name || null, file_type || null, section]
      );
      saved = ins.rows[0];
    }

    return res.status(201).json({ success: true, message: 'บันทึก section สำเร็จ', file: saved });
  } catch (err) {
    console.error('POST /:id/sections error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// =======================================================
// SUBMIT
// =======================================================
router.post('/:id/submit', auth, async (req, res) => {
  const documentId = Number(req.params.id);

  if (!Number.isFinite(documentId) || documentId <= 0) {
    return res.status(400).json({ success: false, message: 'documentId ไม่ถูกต้อง' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const docQ = await client.query(
      `SELECT d.document_id, d.user_id, d.title, d.status
       FROM public.documents d
       WHERE d.document_id = $1
       LIMIT 1
       FOR UPDATE`,
      [documentId]
    );
    if (!docQ.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
    }

    const doc = docQ.rows[0];

    if (Number(doc.user_id) !== Number(req.user.user_id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ส่งเอกสารนี้' });
    }

    const meQ = await client.query(
      `SELECT email FROM public.users WHERE user_id = $1 LIMIT 1`,
      [doc.user_id]
    );
    const myEmail = String(meQ.rows?.[0]?.email || '').trim();
    if (!myEmail) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ต้องเพิ่มอีเมลในโปรไฟล์ก่อน จึงจะส่งตรวจได้' });
    }

    const status = String(doc.status || '').toLowerCase();
    if (!['draft', 'rejected'].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ส่งได้เฉพาะ draft หรือ rejected' });
    }

    const filesQ = await client.query(
      `SELECT DISTINCT LOWER(COALESCE(NULLIF(section,''),'main')) AS section
       FROM public.document_files
       WHERE document_id = $1`,
      [documentId]
    );
    const present = new Set(filesQ.rows.map(r => String(r.section || '').toLowerCase()));

    const missing = REQUIRED_SECTIONS.filter(s => !present.has(String(s).toLowerCase()));
    if (missing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'กรุณาแนบไฟล์ให้ครบก่อนส่งให้ที่ปรึกษา',
        missing_sections: missing,
      });
    }

    const stuQ = await client.query(
      `SELECT user_id, advisor_id
       FROM public.users
       WHERE user_id = $1 AND role::text = 'student'
       LIMIT 1`,
      [doc.user_id]
    );
    if (!stuQ.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษาเจ้าของเอกสาร' });
    }

    const advisorId = stuQ.rows[0].advisor_id;
    if (!advisorId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'ยังไม่ได้กำหนดที่ปรึกษา กรุณาให้แอดมินกำหนด advisor ก่อนส่ง',
      });
    }

    const advQ = await client.query(
      `SELECT user_id, role, email
       FROM public.users
       WHERE user_id = $1
       LIMIT 1`,
      [advisorId]
    );
    if (!advQ.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ไม่พบอาจารย์ที่ปรึกษาที่ถูกกำหนด' });
    }
    const advRole = String(advQ.rows[0].role || '').toLowerCase();
    if (advRole !== 'teacher') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'advisor ต้องเป็น teacher เท่านั้น (admin ไม่รับเป็นที่ปรึกษา)',
      });
    }

    await client.query(
      `UPDATE public.documents SET status = 'pending' WHERE document_id = $1`,
      [documentId]
    );

    await client.query('COMMIT');

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/document-detail/${documentId}`;
    await safeNotify({
      userId: advisorId,
      documentId,
      subject: 'นักศึกษาส่งผลงานให้ตรวจแล้ว',
      message: `มีการส่งผลงาน: "${doc.title}"\nดูรายละเอียด: ${link}`,
    });

    return res.json({ success: true, message: 'ส่งเอกสารให้ที่ปรึกษาแล้ว' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('submit error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  } finally {
    client.release();
  }
});

// =======================================================
// TIMELINE (auth เท่านั้น)
// =======================================================
router.get('/:id/timeline', auth, async (req, res) => {
  try {
    const documentId = Number(req.params.id);
    if (!Number.isFinite(documentId) || documentId <= 0) {
      return res.status(400).json({ success: false, message: 'documentId ไม่ถูกต้อง' });
    }

    const docQ = await db.query(
      'SELECT user_id FROM public.documents WHERE document_id = $1 LIMIT 1',
      [documentId]
    );
    if (!docQ.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const ownerId = Number(docQ.rows[0].user_id);
    const requesterId = Number(req.user.user_id);
    const isOwner = ownerId === requesterId;

    if (!isOwner) {
      if (isAdmin(req)) {
        // ok
      } else if (isTeacher(req)) {
        const chk = await db.query(
          `SELECT 1
           FROM public.users
           WHERE user_id = $1 AND advisor_id = $2
           LIMIT 1`,
          [ownerId, requesterId]
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
       LEFT JOIN public.users u ON u.user_id = ah.approver_id
       WHERE ah.document_id = $1
       ORDER BY ah.approved_at ASC, ah.approval_id ASC`,
      [documentId]
    );

    const timeline = rows.map(r => ({
      ...r,
      status: normalizeStatus(r.status),
    }));

    return res.json({ success: true, timeline });
  } catch (err) {
    console.error('timeline error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// =======================================================
// GET DOCUMENT DETAIL (public ได้ เฉพาะ approved)
// ✅ แก้: ส่ง file_type ให้ frontend
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
          file_type: file.file_type || null,
        };
      } else {
        downloadFiles.push({
          document_file_id: file.document_file_id,
          file_path: file.file_path,
          section,
          original_name: file.original_name || 'file',
          file_type: file.file_type || null,
        });
      }
    }

    res.json({ document: doc, categories: catRes.rows, videoFile, downloadFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// =======================================================
// GET CATEGORIES (แก้ให้ปลอดภัย: optionalAuth + เช็คสิทธิ์)
// =======================================================
router.get('/:id/categories', optionalAuth, async (req, res) => {
  try {
    const documentId = Number(req.params.id);
    if (!Number.isFinite(documentId) || documentId <= 0) {
      return res.status(400).json({ message: 'documentId ไม่ถูกต้อง' });
    }

    const docRes = await db.query(
      'SELECT document_id, user_id, status FROM public.documents WHERE document_id = $1 LIMIT 1',
      [documentId]
    );
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
          return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
        }
      } else {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
      }
    }

    const { rows } = await db.query(
      `
      SELECT c.categorie_id, c.name
      FROM public.document_categories dc
      JOIN public.categories c ON c.categorie_id = dc.categorie_id
      WHERE dc.document_id = $1
      ORDER BY c.name ASC
      `,
      [documentId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('DB error (document categories):', err);
    return res.status(500).json({ message: 'ดึงหมวดหมู่ไม่สำเร็จ' });
  }
});

module.exports = router;