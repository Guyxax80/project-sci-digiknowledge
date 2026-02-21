// routes/upload.js
const express = require('express');
const multer = require('multer');
const db = require('../db');
const cloudinary = require('../config/cloudinary');
const supabase = require('../config/supabase'); // ✅ เพิ่มไฟล์ config/supabase.js ตามที่ให้ไป
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
const VIDEO_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10 นาที

// ✅ เก็บไฟล์ใน memory แล้วอัปขึ้น Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
});
const uploadSingleFile = upload.single('file');

// ===== Helpers =====
const normalizeStatus = (status) => {
  if (!status) return 'draft';
  if (status === 'published') return 'pending';
  if (['draft', 'pending', 'approved', 'rejected'].includes(status)) return status;
  return 'draft';
};

const isVideo = (mime) => typeof mime === 'string' && mime.startsWith('video/');

const isDoc = (mime) =>
  [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].includes(mime);

const extFromMime = (mime) => {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/msword') return 'doc';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  return 'bin';
};

// ===== Optional column check: cloudinary_public_id =====
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
  const { client, documentId, filePath, originalName, fileType, section, publicId } = payload;
  const queryClient = client || db;

  // ถ้ามีคอลัมน์ cloudinary_public_id ก็ใส่ (เฉพาะกรณี video ที่มาจาก cloudinary)
  if (publicId && (await supportsCloudinaryPublicId())) {
    await queryClient.query(
      'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at, cloudinary_public_id) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
      [documentId, filePath, originalName, fileType, section, publicId],
    );
    return;
  }

  await queryClient.query(
    'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW())',
    [documentId, filePath, originalName, fileType, section],
  );
}

const parseCategorieIds = (rawCategorieIds) => {
  if (rawCategorieIds === undefined || rawCategorieIds === null || rawCategorieIds === '') {
    return [];
  }

  let parsed = rawCategorieIds;

  if (typeof rawCategorieIds === 'string') {
    try {
      parsed = JSON.parse(rawCategorieIds);
    } catch (_err) {
      const e = new Error('รูปแบบ categorie_ids ไม่ถูกต้อง');
      e.status = 400;
      throw e;
    }
  }

  if (!Array.isArray(parsed)) {
    const e = new Error('categorie_ids ต้องเป็น array');
    e.status = 400;
    throw e;
  }

  const sanitizedIds = [...new Set(parsed
    .map((item) => Number.parseInt(item, 10))
    .filter((id) => Number.isInteger(id) && id > 0))];

  if (sanitizedIds.length > 2) {
    const e = new Error('เลือกหมวดหมู่ได้ไม่เกิน 2 หมวดหมู่');
    e.status = 400;
    throw e;
  }

  return sanitizedIds;
};

async function assertStudentCanUpload(userId) {
  if (!userId) {
    const e = new Error('กรุณาเข้าสู่ระบบก่อนอัปโหลด');
    e.status = 401;
    throw e;
  }

  const { rows } = await db.query(
    'SELECT user_id, role, student_id FROM public.users WHERE user_id = $1 LIMIT 1',
    [userId],
  );

  if (!rows.length) {
    const e = new Error('ไม่พบผู้ใช้');
    e.status = 401;
    throw e;
  }

  const u = rows[0];

  if (String(u.role).toLowerCase() !== 'student') {
    const e = new Error('บัญชีผู้ใช้ทั่วไปยังอัปโหลดไม่ได้ (ต้องยืนยัน Student ID ให้เป็นนักศึกษา)');
    e.status = 403;
    throw e;
  }

  if (!u.student_id) {
    const e = new Error('Student ID ไม่ถูกต้องหรือยังไม่ยืนยัน');
    e.status = 403;
    throw e;
  }

  return u;
}

async function uploadVideoToCloudinary(file, userId) {
  const folder = `digiknowledge/videos/${userId}`;
  const fileSizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
  const uploadOptions = {
    resource_type: 'video',
    folder,
    chunk_size: 6000000,
    timeout: VIDEO_UPLOAD_TIMEOUT_MS,
  };

  console.info('[upload] video upload start', {
    size: file.size,
    sizeMB: fileSizeMB,
    mimetype: file.mimetype,
    resource_type: uploadOptions.resource_type,
    folder: uploadOptions.folder,
    chunk_size: uploadOptions.chunk_size,
  });

  try {
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_chunked_stream(uploadOptions, (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('[upload] cloudinary video upload failed', {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    });

    const wrappedError = new Error('อัปโหลดวิดีโอไป Cloudinary ไม่สำเร็จ');
    wrappedError.status = 502;
    wrappedError.details = {
      provider: 'cloudinary',
      reason: error.message,
      http_code: error.http_code || null,
    };
    throw wrappedError;
  }
}

// =======================================================
// POST /api/upload   (ไฟล์เอกสาร -> Supabase, วิดีโอ -> Cloudinary)
// =======================================================
router.post('/', auth, requireRole('student'), (req, res, next) => {
  uploadSingleFile(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `ขนาดไฟล์เกินกำหนด (${Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))}MB)`,
        });
      }

      return res.status(400).json({
        success: false,
        message: `Multer error: ${err.message}`,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'ไม่สามารถอ่านไฟล์ที่อัปโหลดได้',
    });
  });
}, async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { title, keywords, academic_year, status, categorie_ids } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อเอกสาร' });
    }

    // ✅ เช็คสิทธิ์อัปโหลด
    const authUser = await assertStudentCanUpload(req.user.user_id);
    console.log("[upload] categorie_ids raw:", req.body?.categorie_ids);

    // ✅ normalize status
    const safeStatus = normalizeStatus(status);

     const parsedCategorieIds = parseCategorieIds(categorie_ids);

    await client.query('BEGIN');

    // 1) สร้างเอกสารก่อน
    const docResult = await client.query(
      'INSERT INTO public.documents (user_id, title, keywords, academic_year, status) VALUES ($1, $2, $3, $4, $5) RETURNING document_id',
      [authUser.user_id, title, keywords || null, academic_year || null, safeStatus],
    );
    const documentId = docResult.rows[0].document_id;

    if (parsedCategorieIds.length > 0) {
      await client.query(
        `INSERT INTO public.document_categories (document_id, categorie_id)
         SELECT $1, unnest($2::int[])
         ON CONFLICT DO NOTHING`,
        [documentId, parsedCategorieIds],
      );
    }

    // 2) ถ้ามีไฟล์ → อัปโหลดตามชนิดไฟล์
    if (req.file) {
      const mimeType = req.file.mimetype;

      // ===== A) VIDEO -> Cloudinary =====
      if (isVideo(mimeType)) {
        let uploaded;
        try {
          uploaded = await uploadVideoToCloudinary(req.file, authUser.user_id);
        } catch (videoErr) {
          throw videoErr;
        }

        await insertDocumentFileWithOptionalPublicId({
          client,
          documentId,
          filePath: uploaded.secure_url, // ✅ เก็บ URL ลง file_path
          originalName: req.file.originalname,
          fileType: mimeType,
          section: 'main',
          publicId: uploaded.public_id,
        });
      }

      // ===== B) PDF/DOC/DOCX -> Supabase Storage =====
      else if (isDoc(mimeType)) {
        const bucket = 'documents'; // ✅ สร้าง bucket นี้ใน Supabase Storage
        const ext = extFromMime(mimeType);
        const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
        const storagePath = `users/${authUser.user_id}/${documentId}/${filename}`;

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(storagePath, req.file.buffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (upErr) {
          console.error('Supabase upload error:', upErr);
          const e = new Error('อัปโหลดขึ้น Supabase ไม่สำเร็จ');
          e.status = 500;
          e.details = upErr;
          throw e;
        }

        // ✅ ถ้า bucket เป็น Public
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        const publicUrl = pub?.publicUrl;

        if (!publicUrl) {
          const e = new Error('สร้าง Public URL ไม่สำเร็จ (เช็คว่า bucket เป็น Public)');
          e.status = 500;
          throw e;
        }

        await insertDocumentFileWithOptionalPublicId({
          client,
          documentId,
          filePath: publicUrl, // ✅ เก็บ URL ลง file_path
          originalName: req.file.originalname,
          fileType: mimeType,
          section: 'main',
          publicId: null,
        });
      } else {
        const e = new Error('ชนิดไฟล์ไม่รองรับ (รองรับ PDF/DOC/DOCX และ VIDEO)');
        e.status = 400;
        throw e;
      }
    }

    await client.query('COMMIT');

    return res.json({ success: true, message: 'อัปโหลดสำเร็จ', documentId });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Upload rollback error:', rollbackErr);
    }

    if (err.code) {
      console.error('Upload DB error:', { message: err.message, code: err.code, detail: err.detail || null });
    }
    console.error('Upload error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'เกิดข้อผิดพลาด',
      error: {
        details: err.details || null,
      },
    });
  } finally {
    client.release();
  }
});

module.exports = router;