const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

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

async function persistFile(documentId, sectionName, file) {
  if (sectionName === 'presentation_video') {
    if (!file.mimetype.startsWith('video/')) throw new Error('ไฟล์วิดีโอต้องเป็น mimetype video/*');
    const result = await cloudinary.uploader.upload(file.path, { resource_type: 'video', folder: 'documents/videos' });
    fs.unlink(file.path, () => {});
    if (await supportsCloudinaryPublicId()) {
      await db.query(
        'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at, cloudinary_public_id) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
        [documentId, result.secure_url, file.originalname, file.mimetype, sectionName, result.public_id],
      );
      return;
    }

    await db.query(
      'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [documentId, result.secure_url, file.originalname, file.mimetype, sectionName],
    );
    return;
  }

  const relativePath = path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
  await db.query(
    'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW())',
    [documentId, relativePath, file.originalname, file.mimetype, sectionName],
  );
}

router.post('/documents/:documentId/sections', upload.fields(sectionFields), async (req, res) => {
  const documentId = Number(req.params.documentId);
  if (!req.files || !Object.keys(req.files).length) return res.status(400).json({ message: 'ไม่มีไฟล์ที่อัปโหลด' });

  try {
    for (const [sectionName, fileArray] of Object.entries(req.files)) {
      await persistFile(documentId, sectionName, fileArray[0]);
    }
    res.json({ message: 'อัปโหลดไฟล์รายส่วนสำเร็จ' });
  } catch (err) {
    console.error('DB error (section files):', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์รายส่วน', error: err.message });
  }
});

router.put('/documents/:documentId/sections/:section', upload.single('file'), async (req, res) => {
  const documentId = Number(req.params.documentId);
  const sectionName = req.params.section;
  if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์' });

  try {
    const doc = await db.query('SELECT status FROM documents WHERE document_id = $1 LIMIT 1', [documentId]);
    if (!doc.rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
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