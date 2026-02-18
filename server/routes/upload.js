const express = require('express');
const multer = require('multer');
const db = require('../db');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

const normalizeStatus = (status) => {
  if (!status) return 'draft';
  if (status === 'published') return 'pending';
  if (['draft', 'pending', 'approved', 'rejected'].includes(status)) return status;
  return 'draft';
};

let supportsCloudinaryPublicIdCache;

async function supportsCloudinaryPublicId() {
  if (typeof supportsCloudinaryPublicIdCache === 'boolean') return supportsCloudinaryPublicIdCache;
  const { rows } = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_files' AND column_name = 'cloudinary_public_id' LIMIT 1",
  );
  supportsCloudinaryPublicIdCache = rows.length > 0;
  return supportsCloudinaryPublicIdCache;
}

async function insertDocumentFileWithOptionalPublicId(payload) {
  const { documentId, filePath, originalName, fileType, section, publicId } = payload;
  if (publicId && await supportsCloudinaryPublicId()) {
    await db.query(
      'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at, cloudinary_public_id) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
      [documentId, filePath, originalName, fileType, section, publicId],
    );
    return;
  }

  await db.query(
    'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW())',
    [documentId, filePath, originalName, fileType, section],
  );
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, keywords, academic_year, user_id, status } = req.body;
    const safeStatus = normalizeStatus(status);

    const docResult = await db.query(
      'INSERT INTO documents (user_id, title, keywords, academic_year, status) VALUES ($1, $2, $3, $4, $5) RETURNING document_id',
      [user_id || null, title, keywords || null, academic_year || null, safeStatus],
    );
    const documentId = docResult.rows[0].document_id;

    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto', folder: 'documents' }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        stream.end(req.file.buffer);
      });

      await insertDocumentFileWithOptionalPublicId({
        documentId,
        filePath: uploaded.secure_url,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        section: 'main',
        publicId: uploaded.public_id,
      });
    }

    res.json({ message: 'อัปโหลดสำเร็จ', documentId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;