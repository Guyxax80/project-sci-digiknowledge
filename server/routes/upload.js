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

async function assertStudentCanUpload(userId) {
  if (!userId) {
    const e = new Error('กรุณาเข้าสู่ระบบก่อนอัปโหลด');
    e.status = 401;
    throw e;
  }

  const { rows } = await db.query(
    'SELECT user_id, role, student_id FROM public.users WHERE user_id = $1 LIMIT 1',
    [userId]
  );

  if (!rows.length) {
    const e = new Error('ไม่พบผู้ใช้');
    e.status = 401;
    throw e;
  }

  const u = rows[0];

  // ✅ ต้องเป็น student เท่านั้น
  if (String(u.role).toLowerCase() !== 'student') {
    const e = new Error('บัญชีผู้ใช้ทั่วไปยังอัปโหลดไม่ได้ (ต้องยืนยัน Student ID ให้เป็นนักศึกษา)');
    e.status = 403;
    throw e;
  }

  // ✅ ต้องมี student_id (ตอนสมัคร ถ้าไม่ตรง student_codes จะถูก set เป็น null)
  if (!u.student_id) {
    const e = new Error('Student ID ไม่ถูกต้องหรือยังไม่ยืนยัน');
    e.status = 403;
    throw e;
  }

  return u; // เผื่อใช้ต่อ
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, keywords, academic_year, user_id, status } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'กรุณากรอกชื่อเอกสาร' });

    // ✅ เช็คสิทธิ์อัปโหลด
    await assertStudentCanUpload(user_id);

    const safeStatus = normalizeStatus(status);

    const docResult = await db.query(
      'INSERT INTO public.documents (user_id, title, keywords, academic_year, status) VALUES ($1, $2, $3, $4, $5) RETURNING document_id',
      [user_id, title, keywords || null, academic_year || null, safeStatus],
    );

    const documentId = docResult.rows[0].document_id;

    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'documents' },
          (error, result) => (error ? reject(error) : resolve(result))
        );
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
    res.status(err.status || 500).json({ message: err.message || 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;