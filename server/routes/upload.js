// server/routes/upload.js
const express = require('express');
const multer = require('multer');
const db = require('../db');
const cloudinary = require('../config/cloudinary');
const supabase = require('../config/supabase');

const auth = require('../middleware/auth');
const requireVerifiedStudent = require('../middleware/requireVerifiedStudent');

const router = express.Router();

const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
const VIDEO_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10 นาที

// ✅ เก็บไฟล์ใน memory แล้วอัปขึ้น Storage (ถ้ามีส่งมา)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
});
const uploadSingleFile = upload.single('file');

// ===== Helpers =====
// ✅ status documents ของคุณ = draft/pending/approved/rejected
const normalizeStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (!s) return 'draft';
  if (['draft', 'pending', 'approved', 'rejected'].includes(s)) return s;
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

  if (publicId && (await supportsCloudinaryPublicId())) {
    await queryClient.query(
      `INSERT INTO document_files
       (document_id, file_path, original_name, file_type, section, uploaded_at, cloudinary_public_id)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
      [documentId, filePath, originalName, fileType, section, publicId],
    );
    return;
  }

  await queryClient.query(
    `INSERT INTO document_files
     (document_id, file_path, original_name, file_type, section, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [documentId, filePath, originalName, fileType, section],
  );
}

// ✅ NEW: upsert by (document_id, section) กัน section ซ้ำ
async function upsertDocumentFileBySection(payload) {
  const { client, documentId, filePath, originalName, fileType, section, publicId } = payload;
  const queryClient = client || db;

  const existing = await queryClient.query(
    `SELECT document_file_id
     FROM public.document_files
     WHERE document_id = $1 AND LOWER(COALESCE(section,'')) = LOWER($2)
     LIMIT 1`,
    [documentId, section],
  );

  if (existing.rows.length) {
    const documentFileId = existing.rows[0].document_file_id;

    // ถ้ามี cloudinary_public_id column และมี publicId -> อัปเดตด้วย
    const canPublicId = publicId && (await supportsCloudinaryPublicId());

    if (canPublicId) {
      const up = await queryClient.query(
        `UPDATE public.document_files
         SET file_path = $1,
             original_name = $2,
             file_type = $3,
             uploaded_at = NOW(),
             cloudinary_public_id = $4
         WHERE document_file_id = $5
         RETURNING *`,
        [filePath, originalName || null, fileType || null, publicId, documentFileId],
      );
      return up.rows[0];
    }

    const up = await queryClient.query(
      `UPDATE public.document_files
       SET file_path = $1,
           original_name = $2,
           file_type = $3,
           uploaded_at = NOW()
       WHERE document_file_id = $4
       RETURNING *`,
      [filePath, originalName || null, fileType || null, documentFileId],
    );
    return up.rows[0];
  }

  // ไม่เจอของเดิม -> insert
  await insertDocumentFileWithOptionalPublicId({
    client: queryClient,
    documentId,
    filePath,
    originalName,
    fileType,
    section,
    publicId,
  });

  const last = await queryClient.query(
    `SELECT *
     FROM public.document_files
     WHERE document_id = $1 AND LOWER(COALESCE(section,'')) = LOWER($2)
     ORDER BY document_file_id DESC
     LIMIT 1`,
    [documentId, section],
  );

  return last.rows[0] || null;
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

  const sanitizedIds = [
    ...new Set(
      parsed
        .map((item) => Number.parseInt(item, 10))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (sanitizedIds.length > 2) {
    const e = new Error('เลือกหมวดหมู่ได้ไม่เกิน 2 หมวดหมู่');
    e.status = 400;
    throw e;
  }

  return sanitizedIds;
};

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
    folder: uploadOptions.folder,
    chunk_size: uploadOptions.chunk_size,
  });

  try {
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_chunked_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
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
// POST /api/upload
// ✅ สร้างเอกสารได้แม้ไม่มีไฟล์ main (ใช้สำหรับ draft)
// - เอกสาร (PDF/DOC/DOCX) -> Supabase Storage (ถ้ามีส่งมา)
// - วิดีโอ -> Cloudinary (ถ้ามีส่งมา)
// =======================================================
router.post(
  '/',
  auth,
  requireVerifiedStudent,
  (req, res, next) => {
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
  },
  async (req, res) => {
    const client = await db.pool.connect();

    try {
      const { title, keywords, academic_year, status, categorie_ids } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อเอกสาร' });
      }

      const safeStatus = normalizeStatus(status);
      const parsedCategorieIds = parseCategorieIds(categorie_ids);

      const userId = req.user.user_id;

      await client.query('BEGIN');

      // 1) สร้างเอกสาร (draft ได้เลย)
      const docResult = await client.query(
        `INSERT INTO public.documents (user_id, title, keywords, academic_year, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING document_id`,
        [userId, title.trim(), keywords || null, academic_year || null, safeStatus],
      );

      const documentId = docResult.rows[0].document_id;

      // 2) ผูกหมวดหมู่
      if (parsedCategorieIds.length > 0) {
        await client.query(
          `INSERT INTO public.document_categories (document_id, categorie_id)
           SELECT $1, unnest($2::int[])
           ON CONFLICT DO NOTHING`,
          [documentId, parsedCategorieIds],
        );
      }

      // 3) ถ้ามีไฟล์ main -> อัปโหลดและบันทึกลง document_files
      if (req.file) {
        const mimeType = req.file.mimetype;

        // ===== A) VIDEO -> Cloudinary =====
        if (isVideo(mimeType)) {
          const uploaded = await uploadVideoToCloudinary(req.file, userId);

          await insertDocumentFileWithOptionalPublicId({
            client,
            documentId,
            filePath: uploaded.secure_url,
            originalName: req.file.originalname,
            fileType: mimeType,
            section: 'main',
            publicId: uploaded.public_id,
          });
        }

        // ===== B) PDF/DOC/DOCX -> Supabase Storage =====
        else if (isDoc(mimeType)) {
          const bucket = 'documents';
          const ext = extFromMime(mimeType);
          const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
          const storagePath = `users/${userId}/${documentId}/${filename}`;

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
            filePath: publicUrl,
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

      return res.json({
        success: true,
        message: 'สร้างเอกสารสำเร็จ',
        documentId,
        uploadedMain: Boolean(req.file),
      });
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
        error: { details: err.details || null },
      });
    } finally {
      client.release();
    }
  },
);

// =======================================================
// ✅ NEW: POST /api/upload/documents/:documentId/sections
// อัปโหลดไฟล์สำหรับ section (cover/chapter1/.../presentation_video)
// - PDF/DOC/DOCX -> Supabase
// - VIDEO -> Cloudinary
// - บันทึกลง document_files โดย upsert ตาม (document_id, section)
// =======================================================
router.post(
  '/documents/:documentId/sections',
  auth,
  requireVerifiedStudent,
  (req, res, next) => {
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
  },
  async (req, res) => {
    const client = await db.pool.connect();

    try {
      const documentId = Number(req.params.documentId);
      if (!Number.isFinite(documentId) || documentId <= 0) {
        return res.status(400).json({ success: false, message: 'documentId ไม่ถูกต้อง' });
      }

      const section = String(req.body.section || '').trim();
      if (!section) {
        return res.status(400).json({ success: false, message: 'ต้องระบุ section' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'ต้องแนบไฟล์ (field: file)' });
      }

      const userId = Number(req.user.user_id);

      await client.query('BEGIN');

      // ✅ ตรวจว่าเอกสารเป็นของ user นี้จริง
      const docQ = await client.query(
        `SELECT document_id, user_id
         FROM public.documents
         WHERE document_id = $1
         LIMIT 1
         FOR UPDATE`,
        [documentId],
      );
      if (!docQ.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
      }

      const ownerId = Number(docQ.rows[0].user_id);
      if (ownerId !== userId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์อัปโหลดให้เอกสารนี้' });
      }

      const mimeType = req.file.mimetype;

      // ===== A) VIDEO -> Cloudinary =====
      if (isVideo(mimeType)) {
        const uploaded = await uploadVideoToCloudinary(req.file, userId);

        const saved = await upsertDocumentFileBySection({
          client,
          documentId,
          filePath: uploaded.secure_url,
          originalName: req.file.originalname,
          fileType: mimeType,
          section,
          publicId: uploaded.public_id,
        });

        await client.query('COMMIT');

        return res.json({
          success: true,
          message: 'อัปโหลด section (video) สำเร็จ',
          documentId,
          section,
          file: saved,
        });
      }

      // ===== B) PDF/DOC/DOCX -> Supabase Storage =====
      if (isDoc(mimeType)) {
        const bucket = 'documents';
        const ext = extFromMime(mimeType);
        const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
        const storagePath = `users/${userId}/${documentId}/sections/${section}/${filename}`;

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

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        const publicUrl = pub?.publicUrl;

        if (!publicUrl) {
          const e = new Error('สร้าง Public URL ไม่สำเร็จ (เช็คว่า bucket เป็น Public)');
          e.status = 500;
          throw e;
        }

        const saved = await upsertDocumentFileBySection({
          client,
          documentId,
          filePath: publicUrl,
          originalName: req.file.originalname,
          fileType: mimeType,
          section,
          publicId: null,
        });

        await client.query('COMMIT');

        return res.json({
          success: true,
          message: 'อัปโหลด section (document) สำเร็จ',
          documentId,
          section,
          file: saved,
        });
      }

      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'ชนิดไฟล์ไม่รองรับ (รองรับ PDF/DOC/DOCX และ VIDEO)',
      });
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Upload section rollback error:', rollbackErr);
      }

      console.error('Upload section error:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาด',
        error: { details: err.details || null },
      });
    } finally {
      client.release();
    }
  },
);

module.exports = router;