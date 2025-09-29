const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');

// Route เล่นวิดีโอ
// GET /files/video/:fileId
router.get('/video/:fileId', (req, res) => {
  const fileId = req.params.fileId;

  db.query(
    'SELECT file_path, file_type FROM document_files WHERE document_file_id = ?',
    [fileId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('เกิดข้อผิดพลาดในการดึงไฟล์วิดีโอ');
      }
      if (!results.length) return res.status(404).send('ไม่พบไฟล์วิดีโอ');

      const file = results[0];
      const videoPath = path.join(__dirname, '..', file.file_path);
      res.sendFile(videoPath);
    }
  );
});

// Route ดาวน์โหลดไฟล์
// GET /files/download/:fileId
router.get('/download/:fileId', (req, res) => {
  const fileId = req.params.fileId;

  db.query(
    'SELECT file_path, original_name FROM document_files WHERE document_file_id = ?',
    [fileId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      }
      if (!results.length) return res.status(404).send('ไม่พบไฟล์');

      const file = results[0];
      const filePath = path.join(__dirname, '..', file.file_path);
      res.download(filePath, file.original_name || 'file');
    }
  );
});

module.exports = router;
