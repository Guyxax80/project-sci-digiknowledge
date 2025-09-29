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

// Expected fields mapped to DB column suffixes
const fieldToColumn = {
  cover: "cover_path",
  abstract: "abstract_path",
  acknowledgement: "acknowledgement_path",
  toc: "toc_path",
  chapter1: "chapter1_path",
  chapter2: "chapter2_path",
  chapter3: "chapter3_path",
  chapter4: "chapter4_path",
  chapter5: "chapter5_path",
  reference: "reference_path",
  appendix: "appendix_path",
  author_bio: "author_bio_path",
  presentation_video: "presentation_video_path"
};

const upload = multer({ storage });

// POST /api/documents/:documentId/sections
router.post("/documents/:documentId/sections", upload.fields(Object.keys(fieldToColumn).map(name => ({ name, maxCount: 1 }))), (req, res) => {
  const documentId = req.params.documentId;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "ไม่มีไฟล์ที่อัปโหลด" });
  }

  // Build update set from provided files
  const providedColumns = [];
  const values = [];

  for (const [fieldName, files] of Object.entries(req.files)) {
    const col = fieldToColumn[fieldName];
    if (!col) continue;
    const f = files[0];
    const normalizedPath = (f.path || "").replace(/\\/g, "/");
    providedColumns.push(col);
    values.push(normalizedPath);
  }

  if (providedColumns.length === 0) {
    return res.status(400).json({ message: "ไม่มีไฟล์ตรงกับฟิลด์ที่กำหนด" });
  }

  // Check if a row already exists for this document
  db.query("SELECT document_file_id FROM document_files WHERE document_id = ? ORDER BY document_file_id DESC LIMIT 1", [documentId], (err, rows) => {
    if (err) {
      console.error("DB error (select document_files):", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลไฟล์" });
    }

    if (rows && rows.length) {
      // Update existing row: set only provided columns
      const setClause = providedColumns.map(col => `${col} = ?`).join(", ");
      const sql = `UPDATE document_files SET ${setClause} WHERE document_file_id = ?`;
      db.query(sql, [...values, rows[0].document_file_id], (uErr) => {
        if (uErr) {
          console.error("DB error (update document_files):", uErr);
          return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตไฟล์" });
        }
        return res.json({ message: "อัปโหลดส่วนประกอบสำเร็จ (อัปเดต)" });
      });
    } else {
      // Insert new row with provided columns
      const cols = ["document_id", ...providedColumns, "uploaded_at"]; 
      const placeholders = ["?", ...providedColumns.map(() => "?"), "NOW()"].join(", ");
      const sql = `INSERT INTO document_files (${cols.join(", ")}) VALUES (${placeholders})`;
      db.query(sql, [documentId, ...values], (iErr) => {
        if (iErr) {
          console.error("DB error (insert document_files):", iErr);
          return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกไฟล์" });
        }
        return res.json({ message: "อัปโหลดส่วนประกอบสำเร็จ (เพิ่มใหม่)" });
      });
    }
  });
});

module.exports = router;


