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
      const rawUserId = (req.user && req.user.id) ? parseInt(req.user.id, 10) : 0;
      const safeUserId = Number.isFinite(rawUserId) && rawUserId > 0 ? rawUserId : 0;

      const ensureDownloadsTableSql = `
        CREATE TABLE IF NOT EXISTS downloads (
          dowload_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          document_id INT NOT NULL,
          document_file_id INT NULL,
          downloaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

      const insertDownloads = (downloaderUserId) => {
        // ตรวจว่ามีคอลัมน์ document_file_id หรือไม่ เพื่อเลือกคำสั่ง INSERT ให้ถูกต้อง
        db.query('SHOW COLUMNS FROM downloads LIKE "document_file_id"', (colErr, colRows) => {
          const hasFileIdCol = !colErr && colRows && colRows.length > 0;
          const sql = hasFileIdCol
            ? 'INSERT INTO downloads (user_id, document_id, document_file_id, downloaded_at) VALUES (?, ?, ?, NOW())'
            : 'INSERT INTO downloads (user_id, document_id, downloaded_at) VALUES (?, ?, NOW())';
          const params = hasFileIdCol ? [downloaderUserId, documentId, fileId] : [downloaderUserId, documentId];
          db.query(sql, params, (dlErr) => {
            if (dlErr) {
              console.warn('Log downloads failed (non-fatal):', dlErr.message || dlErr);
            }
          });
        });
      };

      const resolveDownloaderIdAndInsert = () => {
        if (safeUserId && safeUserId > 0) {
          return insertDownloads(safeUserId);
        }
        // ไม่มีผู้ใช้ล็อกอิน: ใช้ผู้สร้างเอกสารเป็น fallback เพื่อไม่ให้ชน FK
        db.query('SELECT user_id FROM documents WHERE document_id = ? LIMIT 1', [documentId], (e1, r1) => {
          const fallbackOwnerId = (!e1 && r1 && r1.length) ? r1[0].user_id : null;
          if (fallbackOwnerId) return insertDownloads(fallbackOwnerId);
          // fallback สุดท้าย: เลือกผู้ใช้คนแรกในระบบ
          db.query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1', (e2, r2) => {
            const anyUserId = (!e2 && r2 && r2.length) ? r2[0].user_id : null;
            if (anyUserId) return insertDownloads(anyUserId);
            // หากไม่มีผู้ใช้เลย ข้ามการบันทึก downloads เพื่อเลี่ยง FK
            console.warn('Skip downloads insert: no valid user_id to satisfy FK');
          });
        });
      };

      db.query(ensureDownloadsTableSql, (crtDlErr) => {
        if (crtDlErr) {
          console.warn('Ensure downloads table failed (non-fatal):', crtDlErr.message || crtDlErr);
        }
        resolveDownloaderIdAndInsert();
      });

      if (documentId) {
        db.query(
          'UPDATE documents SET download_count = COALESCE(download_count, 0) + 1 WHERE document_id = ?',
          [documentId],
          (updErr) => {
            if (updErr) console.warn('Update documents.download_count failed (non-fatal):', updErr.message || updErr);
          }
        );
      }

      // เลิกใช้ตาราง file_downloads และรวมข้อมูลไว้ที่ downloads แทน

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