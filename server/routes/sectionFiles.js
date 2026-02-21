const express = require('express');
const multer = require('multer');
const db = require('../db');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const BUCKET = process.env.SUPABASE_BUCKET_DOCUMENTS || 'documents';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const storage = multer.memoryStorage();

console.log('[sections] BUCKET =', BUCKET);
console.log('[sections] SUPABASE_URL =', process.env.SUPABASE_URL);

const sectionFields = [
  { name: 'cover', maxCount: 1 }, { name: 'abstract', maxCount: 1 }, { name: 'acknowledgement', maxCount: 1 }, { name: 'toc', maxCount: 1 },
  { name: 'chapter1', maxCount: 1 }, { name: 'chapter2', maxCount: 1 }, { name: 'chapter3', maxCount: 1 }, { name: 'chapter4', maxCount: 1 },
  { name: 'chapter5', maxCount: 1 }, { name: 'reference', maxCount: 1 }, { name: 'bibliography', maxCount: 1 }, { name: 'appendix', maxCount: 1 },
  { name: 'author_bio', maxCount: 1 }, { name: 'presentation_video', maxCount: 1 },
];

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

let supportsCloudinaryPublicIdCache;

async function supportsCloudinaryPublicId() {
  if (typeof supportsCloudinaryPublicIdCache === 'boolean') return supportsCloudinaryPublicIdCache;
  const { rows } = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_files' AND column_name = 'cloudinary_public_id' LIMIT 1",
  );
  supportsCloudinaryPublicIdCache = rows.length > 0;
  return supportsCloudinaryPublicIdCache;
}

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

const safeObjectName = (name) => {
  const base = String(name || 'file').trim();
  return encodeURIComponent(base).replace(/%2F/gi, '-');
};
  
const uploadVideo = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { resource_type: 'video', folder: 'documents/videos' },
    (error, result) => (error ? reject(error) : resolve(result)),
  );
  stream.end(buffer);
});

async function persistFile(documentId, sectionName, file) {
  const originalName = fixOriginalName(file.originalname);

  if (sectionName === 'presentation_video') {
    if (!file.mimetype.startsWith('video/')) throw new Error('ไฟล์วิดีโอต้องเป็น mimetype video/*');

    const result = await uploadVideo(file.buffer);

    await db.query(
      `INSERT INTO document_files
        (document_id, file_path, original_name, file_type, section, uploaded_at,
         provider, public_url, cloudinary_public_id, mime_type, size_bytes)
       VALUES
        ($1,$2,$3,$4,$5,NOW(),
         'cloudinary',$6,$7,$8,$9)`,
      [
        documentId,
        result.secure_url,
        originalName,
        file.mimetype,
        sectionName,
        result.secure_url,
        result.public_id,
        file.mimetype,
        file.size || null,
      ],
    );
    return;
  }

  const safeFileName = sanitizeFileName(originalName);
  const objectPath =
    `${documentId}/${sectionName}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeObjectName(originalName)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const publicUrl = pub?.publicUrl || null;

  await db.query(
    `INSERT INTO document_files
      (document_id, file_path, original_name, file_type, section, uploaded_at,
       provider, bucket, storage_path, public_url, mime_type, size_bytes)
     VALUES
      ($1,$2,$3,$4,$5,NOW(),
       'supabase',$6,$7,$8,$9,$10)`,
    [
      documentId,
      publicUrl || objectPath,     // compat
      originalName,
      file.mimetype,
      sectionName,
      BUCKET,
      objectPath,
      publicUrl,
      file.mimetype,
      file.size || null,
    ],
  );
}

router.post('/documents/:documentId/sections', auth, requireRole('student'), upload.fields(sectionFields), async (req, res) => {
  const documentId = Number(req.params.documentId);
  if (!req.files || !Object.keys(req.files).length) return res.status(400).json({ message: 'ไม่มีไฟล์ที่อัปโหลด' });

  try {
    const ownerCheck = await db.query('SELECT user_id FROM documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!ownerCheck.rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
    if (Number(ownerCheck.rows[0].user_id) !== Number(req.user.user_id)) return res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไขเอกสารนี้' });

    for (const [sectionName, fileArray] of Object.entries(req.files)) {
      await persistFile(documentId, sectionName, fileArray[0]);
    }
    res.json({ message: 'อัปโหลดไฟล์รายส่วนสำเร็จ' });
  } catch (err) {
    console.error('DB error (section files):', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์รายส่วน', error: err.message });
  }
});

router.put('/documents/:documentId/sections/:section', auth, requireRole('student'), upload.single('file'), async (req, res) => {
  const documentId = Number(req.params.documentId);
  const sectionName = req.params.section;
  if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์' });

  try {
    const doc = await db.query('SELECT user_id, status FROM documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!doc.rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
    if (Number(doc.rows[0].user_id) !== Number(req.user.user_id)) return res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไขเอกสารนี้' });
    if (String(doc.rows[0].status || '').toLowerCase() !== 'draft') return res.status(403).json({ message: 'อนุญาตเฉพาะ draft' });

    await db.query('DELETE FROM document_files WHERE document_id = $1 AND section = $2', [documentId, sectionName]);
    await persistFile(documentId, sectionName, req.file);
    res.json({ success: true, message: 'แทนที่ไฟล์สำเร็จ' });
  } catch (err) {
    console.error('section replace error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message });
  }
});

module.exports = router;