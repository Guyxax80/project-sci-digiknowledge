const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');

// ✅ สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ ฟังก์ชันแก้ชื่อไฟล์ไทยเพี้ยน (แปลงเฉพาะกรณีที่เพี้ยนจริง)
const normalizeOriginalName = (name) => {
  if (!name) return name;

  // ตรวจจับอาการเพี้ยนที่พบบ่อยของภาษาไทย (UTF-8 -> latin1)
  // ตัวอย่างของคุณ: à¹à¸... และมี â â ด้วย
  const looksMojibake = /à[¹¸]|â|Ã/i.test(name);
  if (!looksMojibake) return name;

  // แปลงกลับเป็น UTF-8
  try {
    const fixed = Buffer.from(name, "latin1").toString("utf8");
    return fixed || name;
  } catch {
    return name;
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    ),
});
const upload = multer({ storage });

// ⚠️ fieldname เป็นภาษาไทยได้ แต่ต้องให้ frontend ส่งชื่อ field ตรงกัน
const sections = [
  'ปก','บทคัดย่อ','กิตติกรรมประกาศ','สารบัญ',
  'บทที่1','บทที่2','บทที่3','บทที่4','บทที่5',
  'บรรณานุกรม','ภาคผนวก','ประวัติผู้จัดทำปริญญานิพนธ์'
];
const sectionFields = sections.map((s) => ({ name: s, maxCount: 1 }));

router.post('/:documentId/files', authenticateToken, upload.fields(sectionFields), async (req, res) => {
  try {
    const documentId = Number(req.params.documentId);
    if (!documentId) return res.status(400).json({ message: 'documentId ไม่ถูกต้อง' });
    if (!req.files) return res.status(400).json({ message: 'ไม่มีไฟล์ให้บันทึก' });

    for (const [section, fileArray] of Object.entries(req.files)) {
      const file = fileArray?.[0];
      if (!file) continue;

      const originalName = normalizeOriginalName(file.originalname);

      await db.query(
        'INSERT INTO document_files (document_id, file_path, original_name, file_type, section) VALUES ($1, $2, $3, $4, $5)',
        [documentId, file.path, originalName, file.mimetype, section],
      );
    }

    res.json({ message: 'อัปโหลดไฟล์สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์', error: err.message });
  }
});

console.log("original:", file.originalname);
console.log("fixed:", normalizeOriginalName(file.originalname));
module.exports = router;