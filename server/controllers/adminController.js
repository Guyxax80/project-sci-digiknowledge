const path = require('path');
const fs = require('fs');
const db = require('../db');

const normalizeStatus = (status) => {
  if (status === 'published') return 'pending';
  return status || 'draft';
};

exports.uploadFile = async (req, res) => {
  try {
    const { title, categorie_id, keywords, academic_year, status, user_id } = req.body;
    const uploaderId = user_id || req.user?.id;

    if (!title) return res.status(400).send('กรุณากรอกชื่อเอกสาร');
    if (!uploaderId) return res.status(401).send('กรุณา login ก่อนอัปโหลด');

    const userFolder = path.join(__dirname, '../uploads/user_' + uploaderId);
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

    const doc = await db.query(
      'INSERT INTO documents (user_id, title, keywords, academic_year, status, uploaded_at, download_count) VALUES ($1, $2, $3, $4, $5, NOW(), 0) RETURNING document_id',
      [uploaderId, title, keywords || null, academic_year || null, normalizeStatus(status)],
    );

    const documentId = doc.rows[0].document_id;

    if (categorie_id) {
      await db.query(
        'INSERT INTO document_categories (document_id, categorie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [documentId, categorie_id],
      );
    }

    if (req.files) {
      for (const [field, fileArr] of Object.entries(req.files)) {
        if (!fileArr.length) continue;
        const file = fileArr[0];
        const section = field.match(/files\[(.+)\]/)[1];
        const fileName = `${Date.now()}_${section}${path.extname(file.originalname)}`;
        const filePath = path.join(userFolder, fileName);
        fs.renameSync(file.path, filePath);

        await db.query(
          'INSERT INTO document_files (document_id, file_path, original_name, file_type, section, uploaded_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [documentId, filePath.replace(/\\/g, '/'), file.originalname, file.mimetype, section],
        );
      }
    }

    res.json({ success: true, message: 'Upload successful', documentId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};