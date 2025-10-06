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
    'SELECT document_id, file_path, original_name FROM document_files WHERE document_file_id = ?',
    [fileId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      }
      if (!results.length) return res.status(404).send('ไม่พบไฟล์');

      const file = results[0];
      const documentId = file.document_id;

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

      // Log/download counters BEFORE sending file to guarantee counting
      const userId = (req.user && req.user.id) ? req.user.id : null;
      const tryInsertDownloads = (uid, did, attempt = 0) => {
        const statements = [
          'INSERT INTO downloads (user_id, document_id, downloaded_at) VALUES (?, ?, NOW())',
          'INSERT INTO download (user_id, document_id, downloaded_at) VALUES (?, ?, NOW())'
        ];
        if (attempt >= statements.length) return;
        db.query(statements[attempt], [uid, did], (dlErr) => {
          if (dlErr) {
            // ถ้า user_id เป็น NOT NULL ให้ลองใส่ 0 แทน
            if (uid == null) {
              return tryInsertDownloads(0, did, attempt);
            }
            // ลองเปลี่ยนชื่อตาราง (downloads -> download)
            return tryInsertDownloads(uid, did, attempt + 1);
          }
        });
      };
      tryInsertDownloads(userId, documentId, 0);

      if (documentId) {
        db.query(
          'UPDATE documents SET download_count = COALESCE(download_count, 0) + 1 WHERE document_id = ?',
          [documentId],
          (updErr) => {
            if (updErr) console.warn('Update documents.download_count failed (non-fatal):', updErr.message || updErr);
          }
        );
      }

      const createFileDownloadsSql = 'CREATE TABLE IF NOT EXISTS file_downloads (document_file_id INT PRIMARY KEY, download_count INT NOT NULL DEFAULT 0)';
      db.query(createFileDownloadsSql, (crtErr) => {
        if (crtErr) {
          console.warn('Create file_downloads failed (non-fatal):', crtErr.message || crtErr);
        } else {
          db.query(
            'INSERT INTO file_downloads (document_file_id, download_count) VALUES (?, 1) ON DUPLICATE KEY UPDATE download_count = download_count + 1',
            [fileId],
            (fdlErr) => {
              if (fdlErr) console.warn('Update file_downloads failed (non-fatal):', fdlErr.message || fdlErr);
            }
          );
        }
      });

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