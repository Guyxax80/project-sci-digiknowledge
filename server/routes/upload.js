const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db"); // mysql connection

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    // ใช้ชื่อไฟล์แบบง่ายๆ เพื่อหลีกเลี่ยงปัญหา encoding
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // เก็บชื่อไฟล์เดิมไว้ใน req object
    req.originalFileName = file.originalname;
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

router.post("/", upload.single("file"), (req, res) => {
  const { title, keywords, academic_year, user_id, status, section } = req.body;
  // รองรับ categorie_ids ทั้งแบบ 'categorie_ids[]', 'categorie_ids', คั่นด้วย comma หรือ JSON
  const rawCategorieIds = req.body['categorie_ids[]'] ?? req.body.categorie_ids;
  const normalizeCategorieIds = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((v) => parseInt(v, 10)).filter(Number.isFinite);
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => parseInt(v, 10)).filter(Number.isFinite);
      }
    } catch (_) {}
    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((v) => v.trim())
        .map((v) => parseInt(v, 10))
        .filter(Number.isFinite);
    }
    return [];
  };
  const categorieIds = normalizeCategorieIds(rawCategorieIds);
  const file = req.file;

  // Debug: ดูข้อมูลที่รับมา
  console.log("=== UPLOAD DEBUG ===");
  console.log("Title:", title);
  console.log("Keywords:", keywords);
  console.log("Academic Year:", academic_year);
  console.log("User ID:", user_id);
  console.log("Status:", status);
  console.log("Section:", section);
  console.log("File:", file ? "Present" : "Missing");
  console.log("All body data:", req.body);
  console.log("===================");

  if (!file) return res.status(400).json({ message: "กรุณาเลือกไฟล์" });

  // แปลง path ให้เป็น /
  const filePath = file.path.replace(/\\/g, "/");

  // 1️⃣ บันทึกข้อมูลเอกสาร (ข้อมูลที่กรอก)
  const sqlDoc = `
    INSERT INTO documents
    (user_id, title, keywords, academic_year, status, uploaded_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  const docParams = [user_id, title, keywords, academic_year, status || "draft"];

  console.log("=== DOCUMENT INSERT ===");
  console.log("SQL:", sqlDoc);
  console.log("Params:", docParams);
  console.log("======================");

  db.query(sqlDoc, docParams, (err, docResult) => {
    if (err) {
      console.error("DB error (documents):", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกเอกสาร" });
    }

    const documentId = docResult.insertId;
    console.log("Document inserted successfully, ID:", documentId);

    // 2️⃣ บันทึกความสัมพันธ์เอกสาร-หมวดหมู่ (ถ้ามี)
    if (categorieIds.length) {
      const values = categorieIds.map((cid) => [documentId, cid]);
      const sqlLink = `INSERT INTO document_categories (document_id, categorie_id) VALUES ?`;
      db.query(sqlLink, [values], (linkErr) => {
        if (linkErr) {
          console.error('DB error (document_categories):', linkErr);
          // ไม่ต้อง return error เพื่อไม่ให้ล้มทั้งงานอัปโหลดไฟล์
        }
      });
    }

    // 3️⃣ บันทึกข้อมูลไฟล์ (ข้อมูลไฟล์)
    const sqlFile = `
      INSERT INTO document_files
      (document_id, file_path, original_name, file_type, section, uploaded_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const fileParams = [documentId, filePath, file.originalname, file.mimetype, section || "อื่นๆ"];

    console.log("=== FILE INSERT ===");
    console.log("SQL:", sqlFile);
    console.log("Params:", fileParams);
    console.log("==================");

    db.query(sqlFile, fileParams, (err2) => {
      if (err2) {
        console.error("DB error (document_files):", err2);
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกไฟล์" });
      }

      console.log("File inserted successfully");
      res.json({ message: "อัปโหลดสำเร็จ", documentId });
    });
  });
});

module.exports = router;
