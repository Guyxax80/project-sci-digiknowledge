const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db");

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + ext;
    cb(null, uniqueName);
  }
});

// Define fields for different document sections
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
  { name: 'bibliography', maxCount: 1 },
  { name: 'appendix', maxCount: 1 },
  { name: 'author_bio', maxCount: 1 },
  { name: 'presentation_video', maxCount: 1 },
];

const upload = multer({ storage });

// POST /api/documents/:documentId/sections
router.post("/documents/:documentId/sections", upload.fields(sectionFields), (req, res) => {
  const documentId = req.params.documentId;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "ไม่มีไฟล์ที่อัปโหลด" });
  }

  // Insert each file as a separate row (multiple rows strategy)
  const insertPromises = [];
  
  for (const [sectionName, fileArray] of Object.entries(req.files)) {
    const file = fileArray[0];
    const filePath = file.path.replace(/\\/g, "/").replace(/^uploads\//, ""); // Normalize path and remove uploads/ prefix

    insertPromises.push(
      new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [documentId, filePath, file.originalname, file.mimetype, sectionName],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      })
    );
  }

  Promise.all(insertPromises)
    .then(() => {
      res.json({ message: "อัปโหลดไฟล์รายส่วนสำเร็จ" });
    })
    .catch((err) => {
      console.error("DB error (section files):", err);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์รายส่วน", error: err.message });
    });
});

// PUT /api/documents/:documentId/sections/:section - แทนที่ไฟล์ของ section (เฉพาะเมื่อเอกสารเป็น draft)
router.put("/documents/:documentId/sections/:section", upload.single('file'), (req, res) => {
  const documentId = req.params.documentId;
  const sectionName = req.params.section;

  if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์' });

  // 1) ตรวจสอบสถานะเอกสาร ต้องเป็น draft เท่านั้น
  db.query('SELECT status FROM documents WHERE document_id = ? LIMIT 1', [documentId], (docErr, rows) => {
    if (docErr) {
      console.error('DB error (select document):', docErr);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
    if (!rows || !rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
    const status = String(rows[0].status || '').toLowerCase();
    if (status !== 'draft') {
      return res.status(403).json({ message: 'อนุญาตแทนที่ไฟล์เฉพาะเอกสารแบบร่าง (draft) เท่านั้น' });
    }

    // 2) หาไฟล์เดิมของ section
    db.query(
      'SELECT document_file_id, file_path FROM document_files WHERE document_id = ? AND section = ? ORDER BY document_file_id ASC LIMIT 1',
      [documentId, sectionName],
      (selErr, frows) => {
        if (selErr) {
          console.error('DB error (select document_files):', selErr);
          return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }

        const incomingPath = req.file.path.replace(/\\/g, '/').replace(/^uploads\//, '');

        const doUpdate = (documentFileId) => {
          db.query(
            'UPDATE document_files SET file_path = ?, original_name = ?, file_type = ?, uploaded_at = NOW() WHERE document_file_id = ?',
            [incomingPath, req.file.originalname, req.file.mimetype, documentFileId],
            (updErr) => {
              if (updErr) {
                console.error('DB error (update document_files):', updErr);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
              }
              return res.json({ success: true, message: 'แทนที่ไฟล์สำเร็จ', document_file_id: documentFileId });
            }
          );
        };

        if (frows && frows.length) {
          // มีไฟล์เดิม: อัปเดตทับและสามารถลบไฟล์เก่าภายหลังได้ (ไม่บล็อกด้วยการลบไฟล์)
          const documentFileId = frows[0].document_file_id;
          doUpdate(documentFileId);
        } else {
          // ไม่มีไฟล์เดิม: แทรกใหม่ให้ section นี้
          db.query(
            'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [documentId, incomingPath, req.file.originalname, req.file.mimetype, sectionName],
            (insErr, insRes) => {
              if (insErr) {
                console.error('DB error (insert document_files):', insErr);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
              }
              return res.json({ success: true, message: 'อัปโหลดไฟล์ใหม่สำเร็จ', document_file_id: insRes.insertId });
            }
          );
        }
      }
    );
  });
});

module.exports = router;

