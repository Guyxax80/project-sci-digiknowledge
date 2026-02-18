const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

const sections = ['ปก','บทคัดย่อ','กิตติกรรมประกาศ','สารบัญ','บทที่1','บทที่2','บทที่3','บทที่4','บทที่5','บรรณานุกรม','ภาคผนวก','ประวัติผู้จัดทำปริญญานิพนธ์'];
const sectionFields = sections.map((s) => ({ name: s, maxCount: 1 }));

router.post('/:documentId/files', authenticateToken, upload.fields(sectionFields), async (req, res) => {
  try {
    const documentId = req.params.documentId;
    if (!req.files) return res.status(400).json({ message: 'ไม่มีไฟล์ให้บันทึก' });

    for (const [section, fileArray] of Object.entries(req.files)) {
      const file = fileArray[0];
      await db.query(
        'INSERT INTO document_files (document_id, file_path, original_name, file_type, section) VALUES ($1, $2, $3, $4, $5)',
        [documentId, file.path, file.originalname, file.mimetype, section],
      );
    }

    res.json({ message: 'อัปโหลดไฟล์สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์', error: err.message });
  }
});

module.exports = router;