const path = require('path');
const db = require('../db');

// controllers/uploadController.js
exports.uploadFile = (req, res) => {
  console.log('Uploaded file info:', req.file);  
  if (!req.file) return res.status(400).send('No file uploaded');

  const { title, category, keywords, academic_year } = req.body;
  const user_id = req.user?.id || 1; // หรือดึงจาก session/auth
  const file_path = req.file.path.replace(/\\/g, '/'); // path ในรูปแบบ URL
  const file_type = req.file.mimetype.split('/')[1];
  const original_name = req.file.originalname;  // ชื่อไฟล์ต้นฉบับ

  const sql = `
    INSERT INTO documents (user_id, title, category, keywords, academic_year, file_path, file_type, original_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, title, category, keywords, academic_year, file_path, file_type, original_name], (err, result) => {
    if (err) {
      console.error('Error saving to database:', err);
      return res.status(500).send('Error saving file info');
    }
    res.json({ message: 'Upload successful', id: result.insertId });
  });
};
