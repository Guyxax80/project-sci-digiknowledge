const path = require('path');
const fs = require('fs');
const db = require('../db');

exports.uploadFile = (req, res) => {
  try {
    const { title, category, keywords, academic_year, is_draft } = req.body;
    const user_id = req.user?.id || 1; // หรือดึงจาก session/auth

    if (!title) return res.status(400).send('กรุณากรอกชื่อเอกสาร');

    // สร้างโฟลเดอร์ user ถ้าไม่มี
    const userFolder = path.join(__dirname, '../uploads/user_' + user_id);
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

    const filesData = {};

    // req.files จะเป็น object: { 'files[ปก]': [file], 'files[บทคัดย่อ]': [file], ... }
    if (req.files) {
      for (const [field, fileArr] of Object.entries(req.files)) {
        if (fileArr.length > 0) {
          const file = fileArr[0];
          const section = field.match(/files\[(.+)\]/)[1]; // ดึงชื่อ section
          const fileName = `${section}${path.extname(file.originalname)}`;
          const filePath = path.join(userFolder, fileName);

          // ย้ายไฟล์ไป folder user
          fs.renameSync(file.path, filePath);

          filesData[section] = {
            file_path: filePath.replace(/\\/g, '/'), // path ในรูปแบบ URL
            original_name: file.originalname,
            file_type: file.mimetype
          };
        }
      }
    }

    // บันทึกลงฐานข้อมูล
    const sql = `
      INSERT INTO documents 
      (user_id, title, category, keywords, academic_year, files, is_draft, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    db.query(sql, [
      user_id,
      title,
      category,
      keywords,
      academic_year,
      JSON.stringify(filesData), // เก็บไฟล์แต่ละ section เป็น JSON
      is_draft ? 1 : 0
    ], (err, result) => {
      if (err) {
        console.error('Error saving to database:', err);
        return res.status(500).send('Error saving file info');
      }
      res.json({ message: 'Upload successful', id: result.insertId });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};