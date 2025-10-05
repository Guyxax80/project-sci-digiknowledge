const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

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
      if (!file.file_type || !file.file_type.startsWith('video/')) {
        return res.status(404).send('ไฟล์นี้ไม่ใช่วิดีโอ');
      }
      
      // Normalize stored path to avoid duplicated 'uploads/' and backslashes
      const storedPath = String(file.file_path || '').replace(/\\/g, '/').replace(/^\.\/?/, '');
      // If stored as absolute/legacy path (e.g., server/uploads/xxx or D:/.../server/uploads/xxx), reduce to basename
      const baseName = path.basename(storedPath);
      const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
      let fullPath = path.join(uploadsRoot, baseName);

      // Fallback: if not found, try using storedPath directly relative to server root
      if (!fs.existsSync(fullPath)) {
        const altPath = path.join(__dirname, '..', storedPath);
        if (fs.existsSync(altPath)) {
          fullPath = altPath;
        }
      }

      console.log('Original path:', file.file_path);
      console.log('Resolved video path:', fullPath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('ไม่พบไฟล์วิดีโอบนเซิร์ฟเวอร์');
      }

      const stat = fs.statSync(fullPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      const contentType = file.file_type || mime.lookup(fullPath) || 'video/mp4';

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
          return res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(fullPath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(fullPath).pipe(res);
      }
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

      // Normalize path like above
      const storedPath = String(file.file_path || '').replace(/\\/g, '/').replace(/^\.\/?/, '');
      const baseName = path.basename(storedPath);
      const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
      let fullPath = path.join(uploadsRoot, baseName);

      if (!fs.existsSync(fullPath)) {
        const altPath = path.join(__dirname, '..', storedPath);
        if (fs.existsSync(altPath)) {
          fullPath = altPath;
        }
      }

      console.log('Original path:', file.file_path);
      console.log('Resolved download path:', fullPath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('ไม่พบไฟล์บนเซิร์ฟเวอร์');
      }

      const downloadName = file.original_name || path.basename(fullPath) || 'file';
      res.download(fullPath, downloadName, (downloadErr) => {
        if (downloadErr) {
          console.error('Download error:', downloadErr);
          if (!res.headersSent) {
            return res.status(500).send('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
          }
        }
      });
    }
  );
});

module.exports = router;