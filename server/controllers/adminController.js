const path = require('path');
const fs = require('fs');
const db = require('../db');

exports.uploadFile = async (req, res) => {
  try {
    const { title, categorie_id, keywords, academic_year, status, user_id } = req.body;
    const uploaderId = user_id || req.user?.id; // ดึงจาก token หรือ localStorage

    if (!title) return res.status(400).send('กรุณากรอกชื่อเอกสาร');
    if (!uploaderId) return res.status(401).send('กรุณา login ก่อนอัปโหลด');

    // สร้างโฟลเดอร์ user ถ้าไม่มี
    const userFolder = path.join(__dirname, '../uploads/user_' + uploaderId);
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

    // 1️⃣ บันทึกเอกสารหลักใน documents
    const docSql = `
      INSERT INTO documents
      (user_id, title, keywords, academic_year, status, uploaded_at, download_count)
      VALUES (?, ?, ?, ?, ?, NOW(), 0)
    `;
    const [docResult] = await new Promise((resolve, reject) => {
      db.query(docSql, [uploaderId, title, keywords, academic_year, status || 0], (err, result) => {
        if (err) reject(err);
        else resolve([result]);
      });
    });

    const documentId = docResult.insertId;

    // 2️⃣ บันทึกหมวดหมู่
    if (categorie_id) {
      const catSql = `INSERT INTO document_categories (document_id, categorie_id) VALUES (?, ?)`;
      db.query(catSql, [documentId, categorie_id], (err) => {
        if (err) console.error('Error saving category:', err);
      });
    }

    // 3️⃣ บันทึกไฟล์แต่ละ section
    if (req.files) {
      for (const [field, fileArr] of Object.entries(req.files)) {
        if (fileArr.length > 0) {
          const file = fileArr[0];
          const section = field.match(/files\[(.+)\]/)[1];
          const fileName = `${Date.now()}_${section}${path.extname(file.originalname)}`;
          const filePath = path.join(userFolder, fileName);

          // ย้ายไฟล์ไป folder user
          fs.renameSync(file.path, filePath);

          // บันทึกลง document_files
          const fileSql = `
            INSERT INTO document_files
            (document_id, file_path, original_name, file_type, section, uploaded_at)
            VALUES (?, ?, ?, ?, ?, NOW())
          `;
          db.query(fileSql, [documentId, filePath.replace(/\\/g, '/'), file.originalname, file.mimetype, section], (err) => {
            if (err) console.error('Error saving file info:', err);
          });
        }
      }
    }

    res.json({ success: true, message: 'Upload successful', documentId });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
