const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /documents - ดึงเอกสารทั้งหมด
router.get('/', (req, res) => {
  db.query('SELECT * FROM documents', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาด:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
    res.json(results);
  });
});

// GET /documents/test - ทดสอบการเชื่อมต่อ
router.get('/test', (req, res) => {
  console.log("=== TEST API CALLED ===");
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// GET /documents/recommended - ดึงเอกสารแนะนำ (ล่าสุด 6 รายการ)
router.get('/recommended', (req, res) => {
  console.log("=== RECOMMENDED DOCUMENTS API ===");
  
  // แก้ไข SQL ให้แสดงข้อมูลทั้งหมดก่อน (ไม่กรอง status) และไม่ JOIN users
  const sql = `
    SELECT 
      d.document_id,
      d.title,
      d.keywords,
      d.academic_year,
      d.uploaded_at,
      d.status,
      d.user_id,
      df.original_name,
      df.file_type,
      df.section
    FROM documents d
    LEFT JOIN document_files df ON d.document_id = df.document_id
    ORDER BY d.uploaded_at DESC
    LIMIT 6
  `;
  
  console.log("SQL Query:", sql);
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาด:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
    
    console.log("Query results:", results);
    console.log("Number of results:", results.length);
    console.log("===============================");
    
    res.json(results);
  });
});

// GET /documents/:id - ดึงรายละเอียดเอกสารพร้อมไฟล์
router.get('/:id', (req, res) => {
  const documentId = req.params.id;

  // ดึงรายละเอียดเอกสาร
  db.query(
    `SELECT d.*, u.username AS uploader 
     FROM documents d 
     JOIN users u ON d.user_id = u.id 
     WHERE d.document_id = ?`,
    [documentId],
    (err, docs) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
      }
      if (!docs.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });

      // ดึงไฟล์ทั้งหมดของเอกสาร
      db.query(
        'SELECT * FROM document_files WHERE document_id = ?',
        [documentId],
        (err, files) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
          }

          const videoFile = files.find(f => f.file_type && f.file_type.startsWith('video'));
          const downloadFiles = files.filter(f => !f.file_type || !f.file_type.startsWith('video'));

          res.json({ document: docs[0], videoFile, downloadFiles });
        }
      );
    }
  );
});

module.exports = router;
