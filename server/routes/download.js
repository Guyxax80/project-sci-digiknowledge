// routes/download.js
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');  // เชื่อมฐานข้อมูล

router.get('/:documentId', (req, res) => {
  const documentId = req.params.documentId;
  // ดาวน์โหลดไฟล์ล่าสุดของเอกสาร หรือเลือกตามต้องการ (ที่นี่เลือกไฟล์แรกของเอกสาร)
  const sql = 'SELECT file_path, original_name, file_type FROM document_files WHERE document_id = ? ORDER BY document_file_id ASC LIMIT 1';
  db.query(sql, [documentId], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('File not found');
    const { file_path, original_name, file_type } = results[0];
    const filePath = path.join(__dirname, '..', file_path);
    if (file_type) {
      res.setHeader('Content-Type', file_type);
    }
    res.download(filePath, original_name || 'file', (dlErr) => {
      if (dlErr) {
        console.error('Error downloading file:', dlErr);
        if (!res.headersSent) res.status(500).send('Error downloading file');
      }
    });
  });
});

module.exports = router;
