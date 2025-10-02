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
  { name: 'reference', maxCount: 1 },
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

module.exports = router;


