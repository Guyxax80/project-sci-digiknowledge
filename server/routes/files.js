const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');

// Route เล่นวิดีโอด้วยการรองรับ Range (จำเป็นสำหรับการเล่น/seek)
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

      const fs = require('fs');
      fs.stat(videoPath, (statErr, stats) => {
        if (statErr || !stats) {
          console.error(statErr);
          return res.status(404).send('ไม่พบไฟล์วิดีโอ');
        }

        const range = req.headers.range;
        const contentType = file.file_type || 'video/mp4';
        const fileSize = stats.size;

        if (!range) {
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', fileSize);
          const readStream = fs.createReadStream(videoPath);
          return readStream.pipe(res);
        }

        const positions = range.replace(/bytes=/, '').split('-');
        const start = parseInt(positions[0], 10);
        const end = positions[1] ? parseInt(positions[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType
        });

        const stream = fs.createReadStream(videoPath, { start, end });
        stream.on('open', () => stream.pipe(res));
        stream.on('error', (e) => {
          console.error(e);
          res.end();
        });
      });
    }
  );
});

// Route ดาวน์โหลดไฟล์ (แนบชื่อไฟล์เดิม และระบุ content-type เมื่อทราบ)
// GET /files/download/:fileId
router.get('/download/:fileId', (req, res) => {
  const fileId = req.params.fileId;

  db.query(
    'SELECT file_path, original_name, file_type FROM document_files WHERE document_file_id = ?',
    [fileId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      }
      if (!results.length) return res.status(404).send('ไม่พบไฟล์');

      const file = results[0];
      const filePath = path.join(__dirname, '..', file.file_path);
      if (file.file_type) {
        res.setHeader('Content-Type', file.file_type);
      }
      res.download(filePath, file.original_name || 'file');
    }
  );
});

module.exports = router;
