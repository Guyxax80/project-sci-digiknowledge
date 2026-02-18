const path = require('path');
const fs = require('fs');
const db = require('../db');

exports.uploadFile = async (req, res) => {
  try {
    const { title, category, keywords, academic_year, is_draft } = req.body;
    const user_id = req.user?.id || 1;
    if (!title) return res.status(400).send('กรุณากรอกชื่อเอกสาร');

    const userFolder = path.join(__dirname, '../uploads/user_' + user_id);
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

    const filesData = {};
    if (req.files) {
      for (const [field, fileArr] of Object.entries(req.files)) {
        if (!fileArr.length) continue;
        const file = fileArr[0];
        const section = field.match(/files\[(.+)\]/)[1];
        const fileName = `${section}${path.extname(file.originalname)}`;
        const filePath = path.join(userFolder, fileName);
        fs.renameSync(file.path, filePath);
        filesData[section] = { file_path: filePath.replace(/\\/g, '/'), original_name: file.originalname, file_type: file.mimetype };
      }
    }

    const { rows } = await db.query(
      'INSERT INTO documents (user_id, title, category, keywords, academic_year, files, is_draft, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING document_id',
      [user_id, title, category || null, keywords || null, academic_year || null, JSON.stringify(filesData), Boolean(is_draft)],
    );

    res.json({ message: 'Upload successful', id: rows[0].document_id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};