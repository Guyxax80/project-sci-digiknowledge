const express = require('express');
const multer = require('multer');
const db = require('../db');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const supabase = require('../config/supabase');

const router = express.Router();
const BUCKET = process.env.SUPABASE_BUCKET_DOCUMENTS || 'documents';
// Cloudinary Free plan supports video uploads up to 100MB.
// Larger videos require a paid Cloudinary plan or alternative storage.
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const envPreview = (value) => {
  const v = String(value || '');
  if (!v) return '<missing>';
  if (v.length < 8) return `${v[0]}***`;
  return `${v.slice(0, 4)}***${v.slice(-4)}`;
};

const requiredSupabaseEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredSupabaseEnv) {
  if (!process.env[key]) {
    throw new Error(`[sections] Missing required env: ${key}`);
  }
}

const cloudinaryEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

console.log('[sections] BUCKET =', BUCKET);
console.log('[sections] SUPABASE_URL =', process.env.SUPABASE_URL);
console.log('[sections] SUPABASE_SERVICE_ROLE_KEY =', envPreview(process.env.SUPABASE_SERVICE_ROLE_KEY));
console.log('[sections] CLOUDINARY_CLOUD_NAME =', envPreview(process.env.CLOUDINARY_CLOUD_NAME));

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

    console.error('[sections] multer upload error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'ไฟล์วิดีโอใหญ่เกิน 100MB',
        field: err.field,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  });
};

// --- fix filename thai mojibake (optional) ---
const fixOriginalName = (name) => {
  if (!name) return name;
  if (!name.includes('à¸') && !name.includes('à¹') && !name.includes('â') && !name.includes('Ã')) return name;
  try {
    const fixed = Buffer.from(name, 'latin1').toString('utf8');
    return fixed || name;
  } catch {
    return name;
  }
};

// ✅ ห้ามเอาชื่อไฟล์จริงไปเป็น key (กัน Invalid key แบบชัวร์)
const getExt = (originalName, mimeType) => {
  const n = String(originalName || '');
  const lastDot = n.lastIndexOf('.');
  if (lastDot > -1 && lastDot < n.length - 1) {
    const ext = n.slice(lastDot + 1).toLowerCase();
    if (ext && ext.length <= 10) return ext;
}

  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/msword') return 'doc';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mimeType?.startsWith('image/')) return (mimeType.split('/')[1] || 'img').toLowerCase();

  return 'bin';
};

const uploadVideo = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'documents/videos' },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });

  const isLikelyJson = (contentType, text) => {
  const body = String(text || '').trim();
  if (!body) return false;
  if (String(contentType || '').toLowerCase().includes('application/json')) return true;
  return body.startsWith('{') || body.startsWith('[');
};

const parseJsonIfPossible = (contentType, text) => {
  if (!isLikelyJson(contentType, text)) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const uploadToSupabaseStorageRest = async ({ objectPath, mimeType, buffer }) => {
  const storageUploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`;
  const method = 'PUT';

  try {
    const upstreamRes = await fetch(storageUploadUrl, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': mimeType || 'application/octet-stream',
      },
      body: buffer,
    });

    const responseText = await upstreamRes.text();
    const parsedJson = parseJsonIfPossible(upstreamRes.headers.get('content-type'), responseText);

    if (!upstreamRes.ok) {
      console.error('[sections] Supabase upload failed', {
        method,
        fullUrl: storageUploadUrl,
        status: upstreamRes.status,
        responseText,
      });

      const upstreamMessage = parsedJson?.message || parsedJson?.error || null;
      const e = new Error(upstreamMessage || `Supabase upload failed with status ${upstreamRes.status}`);
      e.status = upstreamRes.status;
      e.responseText = responseText;
      throw e;
    }

    return parsedJson;
  } catch (error) {
    if (!error?.status) {
      console.error('[sections] Supabase upload request error', {
        method,
        fullUrl: storageUploadUrl,
        status: error?.status || null,
        responseText: error?.responseText || error?.message || null,
      });
    }
    throw error;
  }
};


async function persistFile(documentId, sectionName, file) {
  const originalName = fixOriginalName(file.originalname);
  const mimeType = file.mimetype;

  // ===== VIDEO -> Cloudinary =====
  if (sectionName === 'presentation_video') {
  for (const key of cloudinaryEnv) {
    if (!process.env[key]) {
      throw new Error(`[sections] Missing required env for video upload: ${key}`);
    }
  }

  console.log('[sections] upload target', {
    provider: 'cloudinary',
    folder: 'documents/videos',
    cloudNamePreview: envPreview(process.env.CLOUDINARY_CLOUD_NAME),
  });

  if (!mimeType?.startsWith('video/')) throw new Error('ไฟล์วิดีโอต้องเป็น mimetype video/*');

  const result = await uploadVideo(file.buffer);

  await db.query(
    `INSERT INTO public.document_files
      (document_id, file_path, original_name, file_type, section, uploaded_at,
       provider, public_url, cloudinary_public_id, mime_type, size_bytes)
     VALUES
      ($1,$2,$3,$4,$5,NOW(),
       'cloudinary',$6,$7,$8,$9)`,
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
    ],
  );

  return;
}

  // ===== FILES -> Supabase Storage =====
  const ext = getExt(originalName, mimeType);

  // ✅ key เป็น ASCII ล้วนแน่นอน
  const objectPath = `${documentId}/${sectionName}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

  console.log('[sections] upload target', {
    provider: 'supabase',
    bucket: BUCKET,
    objectPath,
    storageUploadUrl: `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
  });

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
     VALUES
      ($1,$2,$3,$4,$5,NOW(),
        'supabase',$6,$7,$8,$9,$10)`,
    [
      documentId,
      publicUrl || objectPath, // compat
      originalName,
      mimeType,
      sectionName,
      BUCKET,
      objectPath,
      publicUrl,
      mimeType,
      file.size || null,
    ],
  );
}

// POST /api/documents/:documentId/sections
router.post('/:documentId/sections', auth, requireRole('student'), uploadSectionFields, async (req, res) => {
  const documentId = Number(req.params.documentId);

  if (!req.files || !Object.keys(req.files).length) {
    return res.status(400).json({ success: false, message: 'ไม่มีไฟล์ที่อัปโหลด' });
  }

  try {
    const ownerCheck = await db.query('SELECT user_id, status FROM public.documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!ownerCheck.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    if (Number(ownerCheck.rows[0].user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขเอกสารนี้' });
    }

    const editableStatuses = ['draft', 'rejected'];
    if (!editableStatuses.includes(String(ownerCheck.rows[0].status || '').toLowerCase())) {
      return res.status(403).json({ success: false, message: 'แก้ไขได้เฉพาะ draft หรือ rejected' });
    }

    for (const [sectionName, fileArray] of Object.entries(req.files)) {
      await persistFile(documentId, sectionName, fileArray[0]);
    }

    return res.json({ success: true, message: 'อัปโหลดไฟล์รายส่วนสำเร็จ' });
  } catch (err) {
    console.error('DB error (section files):', err);
    const status = Number(err?.status || err?.statusCode);
    const upstreamStatus = Number(err?.originalError?.status || err?.cause?.status || err?.cause?.statusCode);
    const normalizedStatus = [400, 401, 403, 404, 409, 413, 415, 422].includes(status)
      ? status
      : [400, 401, 403, 404, 409, 413, 415, 422].includes(upstreamStatus)
        ? upstreamStatus
        : 500;

    return res.status(normalizedStatus).json({
      success: false,
      message: normalizedStatus === 404
        ? 'อัปโหลดล้มเหลว: ปลายทางจัดเก็บไฟล์ไม่พบ endpoint (404) กรุณาตรวจ SUPABASE_URL/Cloudinary config'
        : 'อัปโหลดไฟล์รายส่วนไม่สำเร็จ กรุณาตรวจการตั้งค่า Storage และลองใหม่',
      error: err.message,
      providerStatus: status || upstreamStatus || null,
    });
  }
});

// PUT /api/documents/:documentId/sections/:section
router.put('/:documentId/sections/:section', auth, requireRole('student'), upload.single('file'), async (req, res) => {
  const documentId = Number(req.params.documentId);
  const sectionName = req.params.section;

   if (!req.file) return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์' });

  try {
    const doc = await db.query('SELECT user_id, status FROM public.documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!doc.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    if (Number(doc.rows[0].user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขเอกสารนี้' });
    }

    if (!['draft', 'rejected'].includes(String(doc.rows[0].status || '').toLowerCase())) {
      return res.status(403).json({ success: false, message: 'แก้ไขได้เฉพาะ draft หรือ rejected' });
    }

    await db.query('DELETE FROM public.document_files WHERE document_id = $1 AND section = $2', [documentId, sectionName]);
    await persistFile(documentId, sectionName, req.file);

    return res.json({ success: true, message: 'แทนที่ไฟล์สำเร็จ' });
  } catch (err) {
    console.error('section replace error:', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: err.message });
  }
});

module.exports = router;