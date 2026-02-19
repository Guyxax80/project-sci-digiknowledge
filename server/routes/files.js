const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const auth = require('../middleware/auth');

const recentDownloadMarks = new Map();
const shouldCountDownloadOnce = (fileId, ip) => {
  const key = `${fileId}:${ip || ''}`;
  const now = Date.now();
  const last = recentDownloadMarks.get(key) || 0;
  if (now - last < 3000) return false;
  recentDownloadMarks.set(key, now);
  return true;
};

const resolveLocalPath = (storedPath) => {
  const normalized = String(storedPath || '').replace(/\\/g, '/').replace(/^\.\/?/, '');
  const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
  const byName = path.join(uploadsRoot, path.basename(normalized));
  if (fs.existsSync(byName)) return byName;
  const relative = path.join(__dirname, '..', normalized);
  if (fs.existsSync(relative)) return relative;
  return null;
};

router.get('/video/:fileId', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT file_path, file_type FROM document_files WHERE document_file_id = $1', [req.params.fileId]);
    if (!rows.length) return res.status(404).send('ไม่พบไฟล์วิดีโอ');
    const file = rows[0];
    if (!file.file_type?.startsWith('video/')) return res.status(404).send('ไฟล์นี้ไม่ใช่วิดีโอ');
    if (String(file.file_path).startsWith('http')) return res.redirect(file.file_path);

    const fullPath = resolveLocalPath(file.file_path);
    if (!fullPath) return res.status(404).send('ไม่พบไฟล์วิดีโอบนเซิร์ฟเวอร์');

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = file.file_type || mime.lookup(fullPath) || 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) return res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${fileSize}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': contentType });
      return fs.createReadStream(fullPath, { start, end }).pipe(res);
    }

    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': contentType, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(fullPath).pipe(res);
   } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงไฟล์วิดีโอ');
  }
});

router.get('/view/:fileId', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT file_path, file_type, original_name FROM document_files WHERE document_file_id = $1', [req.params.fileId]);
    if (!rows.length) return res.status(404).json({ error: 'ไม่พบไฟล์' });
    const file = rows[0];
    if (String(file.file_path).startsWith('http')) return res.redirect(file.file_path);

    const fullPath = resolveLocalPath(file.file_path);
    if (!fullPath) return res.status(404).json({ error: 'ไม่พบไฟล์บนเซิร์ฟเวอร์' });

    res.setHeader('Content-Type', file.file_type || mime.lookup(fullPath) || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name || 'file.pdf')}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงไฟล์' });
  }
});

router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT document_id, file_path, original_name FROM document_files WHERE document_file_id = $1', [req.params.fileId]);
    if (!rows.length) return res.status(404).send('ไม่พบไฟล์');
    const file = rows[0];

    if (shouldCountDownloadOnce(req.params.fileId, req.ip)) {
      if (file.document_id) await db.query('UPDATE documents SET download_count = COALESCE(download_count, 0) + 1 WHERE document_id = $1', [file.document_id]);
      await db.query('UPDATE document_files SET download_count = COALESCE(download_count, 0) + 1 WHERE document_file_id = $1', [req.params.fileId]);
    }

    if (String(file.file_path).startsWith('http')) return res.redirect(file.file_path);
    const fullPath = resolveLocalPath(file.file_path);
    if (!fullPath) return res.status(404).send('ไม่พบไฟล์บนเซิร์ฟเวอร์');
    return res.download(fullPath, file.original_name || path.basename(fullPath) || 'file');
  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
  }
});

module.exports = router;