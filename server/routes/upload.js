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
  const { title, keywords, academic_year, user_id, status, section, categorie_id } = req.body;
  const categoryName = (req.body.category || req.body.categorie_name || "").trim();
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
  const filePath = file.path.replace(/\\/g, "/").replace(/^uploads\//, "");

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

    // 1.5 บันทึกความสัมพันธ์หมวดหมู่ (รองรับทั้ง categorie_id และ category name)
    const insertCategoryRelation = (next) => {
      // ถ้ามี id มาก่อน ใช้เลย
      if (categorie_id) {
        const sqlCat = "INSERT INTO document_categories (document_id, categorie_id) VALUES (?, ?)";
        return db.query(sqlCat, [documentId, categorie_id], (catErr) => {
          if (catErr) {
            console.error("DB error (document_categories via id):", catErr);
          }
          return next();
        });
      }

      // ถ้าไม่มี id แต่มีชื่อหมวดหมู่ ให้ find-or-create ในตาราง categorie
      if (categoryName) {
        db.query("SELECT categorie_id FROM categorie WHERE name = ? LIMIT 1", [categoryName], (selErr, rows) => {
          if (selErr) {
            console.error("DB error (select categorie by name):", selErr);
            return next();
          }
          const ensureRelation = (catId) => {
            const sqlCat = "INSERT INTO document_categories (document_id, categorie_id) VALUES (?, ?)";
            db.query(sqlCat, [documentId, catId], (relErr) => {
              if (relErr) {
                console.error("DB error (document_categories via name):", relErr);
              }
              return next();
            });
          };

        if (rows && rows.length) {
            return ensureRelation(rows[0].categorie_id);
          }
          // create new category
          db.query("INSERT INTO categorie (name) VALUES (?)", [categoryName], (insErr, insRes) => {
            if (insErr) {
              console.error("DB error (insert categorie):", insErr);
              return next();
            }
            return ensureRelation(insRes.insertId);
          });
        });
      } else {
        return next();
      }
    };

    insertCategoryRelation(() => {
      // 2️⃣ บันทึกข้อมูลไฟล์ (ข้อมูลไฟล์)
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
});

module.exports = router;
