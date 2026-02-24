const express = require('express');
const multer = require('multer');
const db = require('../db');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const supabase = require('../config/supabase');

const router = express.Router();

const BUCKET = process.env.SUPABASE_BUCKET_DOCUMENTS || 'documents';
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

// ===== ENV CHECK =====
const requiredSupabaseEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredSupabaseEnv) {
  if (!process.env[key]) {
    throw new Error(`[sections] Missing required env: ${key}`);
  }
}

const cloudinaryEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

// ===== Allowed sections =====
const ALLOWED_SECTIONS = new Set([
  'main',
  'cover',
  'abstract',
  'acknowledgement',
  'toc',
  'chapter1',
  'chapter2',
  'chapter3',
  'chapter4',
  'chapter5',
  'reference',
  'bibliography',
  'appendix',
  'author_bio',
  'presentation_video',
]);

const normalizeSection = (s) => String(s || '').trim().toLowerCase();

// ✅ แก้ได้เฉพาะ draft / rejected
const canEditStatus = (statusRaw) => {
  const status = String(statusRaw || '').trim().toLowerCase();
  return ['draft', 'rejected'].includes(status);
};

// ===== multer =====
const storage = multer.memoryStorage();

const sectionFields = [
  { name: 'cover', maxCount: 1 },
  { name: 'abstract', maxCount: 1 },
  { name: 'acknowledgement', maxCount: 1 },
  { name: 'toc', maxCount: 1 },
  { name: 'chapter1', maxCount: 1 },
  { name: 'chapter2', maxCount: 1 },
  { name: 'chapter3', maxCount: 1 },
  { name: 'chapter4', maxCount: 1 },
  { name: 'chapter5', maxCount: 1 },
  { name: 'reference', maxCount: 1 },
  { name: 'bibliography', maxCount: 1 },
  { name: 'appendix', maxCount: 1 },
  { name: 'author_bio', maxCount: 1 },
  { name: 'presentation_video', maxCount: 1 },
];

const upload = multer({ storage, limits: { fileSize: MAX_VIDEO_BYTES } });

const uploadSectionFields = (req, res, next) => {
  upload.fields(sectionFields)(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'ไฟล์ใหญ่เกิน 100MB',
        field: err.field,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  });
};

// ===== Helpers =====
const getExt = (originalName, mimeType) => {
  const n = String(originalName || '');
  const lastDot = n.lastIndexOf('.');
  if (lastDot > -1 && lastDot < n.length - 1) {
    return n.slice(lastDot + 1).toLowerCase();
  }

  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType?.startsWith('image/')) return mimeType.split('/')[1];
  return 'bin';
};

const uploadVideo = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'documents/videos' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const uploadToSupabaseStorageRest = async ({ objectPath, mimeType, buffer }) => {
  const storageUploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`;

  const upstreamRes = await fetch(storageUploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': mimeType || 'application/octet-stream',
    },
    body: buffer,
  });

  if (!upstreamRes.ok) {
    const text = await upstreamRes.text();
    throw new Error(text || `Supabase upload failed (${upstreamRes.status})`);
  }
};

// ===== Persist =====
async function persistFile(documentId, sectionNameRaw, file) {
  const sectionName = normalizeSection(sectionNameRaw);

  if (!ALLOWED_SECTIONS.has(sectionName)) {
    const e = new Error(`section ไม่ถูกต้อง: ${sectionName}`);
    e.status = 400;
    throw e;
  }

  const mimeType = file.mimetype;
  const originalName = file.originalname;

  // ===== VIDEO =====
  if (sectionName === 'presentation_video') {
    for (const key of cloudinaryEnv) {
      if (!process.env[key]) {
        throw new Error(`Missing Cloudinary env: ${key}`);
      }
    }

    if (!mimeType?.startsWith('video/')) {
      throw new Error('ไฟล์วิดีโอต้องเป็น video/*');
    }

    const result = await uploadVideo(file.buffer);

    await db.query(
      `INSERT INTO public.document_files
        (document_id, file_path, original_name, file_type, section, uploaded_at,
         provider, public_url, cloudinary_public_id, mime_type, size_bytes)
       VALUES ($1,$2,$3,$4,$5,NOW(),'cloudinary',$6,$7,$8,$9)`,
      [
        documentId,
        result.secure_url,
        originalName,
        mimeType,
        sectionName,
        result.secure_url,
        result.public_id,
        mimeType,
        file.size || null,
      ]
    );

    return;
  }

  // ===== Supabase =====
  const ext = getExt(originalName, mimeType);
  const objectPath = `${documentId}/${sectionName}/${Date.now()}.${ext}`;

  await uploadToSupabaseStorageRest({
    objectPath,
    mimeType,
    buffer: file.buffer,
  });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const publicUrl = pub?.publicUrl || null;

  await db.query(
    `INSERT INTO public.document_files
      (document_id, file_path, original_name, file_type, section, uploaded_at,
       provider, bucket, storage_path, public_url, mime_type, size_bytes)
     VALUES ($1,$2,$3,$4,$5,NOW(),'supabase',$6,$7,$8,$9,$10)`,
    [
      documentId,
      publicUrl || objectPath,
      originalName,
      mimeType,
      sectionName,
      BUCKET,
      objectPath,
      publicUrl,
      mimeType,
      file.size || null,
    ]
  );
}

// ===============================
// POST upload many sections
// ===============================
router.post('/:documentId/sections', auth, requireRole('student'), uploadSectionFields, async (req, res) => {
  const documentId = Number(req.params.documentId);

  if (!req.files || !Object.keys(req.files).length) {
    return res.status(400).json({ success: false, message: 'ไม่มีไฟล์ที่อัปโหลด' });
  }

  try {
    const doc = await db.query(
      'SELECT user_id, status FROM public.documents WHERE document_id = $1 LIMIT 1',
      [documentId]
    );

    if (!doc.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
    }

    if (Number(doc.rows[0].user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขเอกสารนี้' });
    }

    if (!canEditStatus(doc.rows[0].status)) {
      return res.status(403).json({ success: false, message: 'แก้ไขได้เฉพาะ draft หรือ rejected' });
    }

    for (const [sectionName, fileArray] of Object.entries(req.files)) {
      await persistFile(documentId, sectionName, fileArray[0]);
    }

    return res.json({ success: true, message: 'อัปโหลดไฟล์รายส่วนสำเร็จ' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'อัปโหลดไม่สำเร็จ', error: err.message });
  }
});

// ===============================
// PUT replace single section
// ===============================
router.put('/:documentId/sections/:section', auth, requireRole('student'), upload.single('file'), async (req, res) => {
  const documentId = Number(req.params.documentId);
  const sectionName = normalizeSection(req.params.section);

  if (!ALLOWED_SECTIONS.has(sectionName)) {
    return res.status(400).json({ success: false, message: 'section ไม่ถูกต้อง' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์' });
  }

  try {
    const doc = await db.query(
      'SELECT user_id, status FROM public.documents WHERE document_id = $1 LIMIT 1',
      [documentId]
    );

    if (!doc.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
    }

    if (Number(doc.rows[0].user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขเอกสารนี้' });
    }

    if (!canEditStatus(doc.rows[0].status)) {
      return res.status(403).json({ success: false, message: 'แก้ไขได้เฉพาะ draft หรือ rejected' });
    }

    await db.query(
      'DELETE FROM public.document_files WHERE document_id = $1 AND section = $2',
      [documentId, sectionName]
    );

    await persistFile(documentId, sectionName, req.file);

    return res.json({ success: true, message: 'แทนที่ไฟล์สำเร็จ' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'แทนที่ไฟล์ไม่สำเร็จ', error: err.message });
  }
});

module.exports = router;