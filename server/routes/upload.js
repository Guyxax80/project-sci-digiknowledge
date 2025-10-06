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
  const { title, keywords, academic_year, user_id, status } = req.body;
  // หมวดหมู่ที่ส่งมาได้หลายรูปแบบ: categorie_id (เดี่ยว), categorie_ids[] (หลายค่า), category/categorie_name (ชื่อเดี่ยว), category_names[] (หลายชื่อ)
  const singleCategorieId = req.body.categorie_id;
  const rawCategorieIds = req.body.categorie_ids || req.body["categorie_ids[]"]; // อาจเป็น array หรือ string
  const singleCategoryName = (req.body.category || req.body.categorie_name || "").trim();
  const rawCategoryNames = req.body.category_names || req.body["category_names[]"]; // อาจเป็น array หรือ string
  // ค่า section สำหรับไฟล์หลัก ใช้ 'main' เป็นค่าเริ่มต้น ไม่ผูกกับหมวดหมู่
  const section = (req.body.section || 'main').toString();
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

  // แปลง path ให้เป็น / และลบ uploads/ prefix ออก
 const filePath = "/uploads/" + file.filename;

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

  // 1.5 บันทึกความสัมพันธ์หมวดหมู่ (รองรับหลายค่า ทั้ง id และชื่อ)
  const insertCategoryRelation = (next) => {
    const parseToArray = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.filter(Boolean);
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) return [];
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [trimmed];
        } catch (_) {
          // รองรับคั่นด้วย comma
          if (trimmed.includes(',')) return trimmed.split(',').map(s => s.trim()).filter(Boolean);
          return [trimmed];
        }
      }
      return [];
    };

    const categorieIds = [
      ...(singleCategorieId ? [singleCategorieId] : []),
      ...parseToArray(rawCategorieIds)
    ]
      .map(v => String(v).trim())
      .filter(Boolean);

    const categoryNames = [
      ...(singleCategoryName ? [singleCategoryName] : []),
      ...parseToArray(rawCategoryNames)
    ]
      .map(v => String(v).trim())
      .filter(Boolean);

    const ensureRelationById = (catId, cb) => {
      // กันซ้ำแบบง่าย ๆ โดยเช็คก่อน insert
      db.query(
        'SELECT 1 FROM document_categories WHERE document_id = ? AND categorie_id = ? LIMIT 1',
        [documentId, catId],
        (selErr, selRows) => {
          if (selErr) {
            console.error('DB error (check relation):', selErr);
            return cb();
          }
          if (selRows && selRows.length) return cb();
          const sqlCat = 'INSERT INTO document_categories (document_id, categorie_id) VALUES (?, ?)';
          db.query(sqlCat, [documentId, catId], (insErr) => {
            if (insErr) console.error('DB error (insert relation):', insErr);
            return cb();
          });
        }
      );
    };

    const ensureRelationByName = (name, cb) => {
      db.query('SELECT categorie_id FROM categorie WHERE name = ? LIMIT 1', [name], (selErr, rows) => {
        if (selErr) {
          console.error('DB error (select categorie by name):', selErr);
          return cb();
        }
        if (rows && rows.length) return ensureRelationById(rows[0].categorie_id, cb);
        db.query('INSERT INTO categorie (name) VALUES (?)', [name], (insErr, insRes) => {
          if (insErr) {
            console.error('DB error (insert categorie):', insErr);
            return cb();
          }
          return ensureRelationById(insRes.insertId, cb);
        });
      });
    };

    const tasks = [];
    categorieIds.forEach(id => tasks.push((cb) => ensureRelationById(id, cb)));
    categoryNames.forEach(n => tasks.push((cb) => ensureRelationByName(n, cb)));

    if (tasks.length === 0) return next();

    let idx = 0;
    const runNext = () => {
      if (idx >= tasks.length) return next();
      const fn = tasks[idx++];
      fn(runNext);
    };
    runNext();
  };

    insertCategoryRelation(() => {
      // 2️⃣ บันทึกข้อมูลไฟล์ (ข้อมูลไฟล์)
    const sqlFile = `
      INSERT INTO document_files
      (document_id, file_path, original_name, file_type, section, uploaded_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const fileParams = [documentId, filePath, file.originalname, file.mimetype, section || 'main'];

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
});

module.exports = router;