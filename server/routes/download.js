const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const auth = require('../middleware/auth');
const db = require('../db');

const resolveLocalPath = (storedPath) => {
  const normalized = String(storedPath || '').replace(/\\/g, '/').replace(/^\.\/?/, '');
  const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
  const byName = path.join(uploadsRoot, path.basename(normalized));
  if (fs.existsSync(byName)) return byName;
  const relative = path.join(__dirname, '..', normalized);
  if (fs.existsSync(relative)) return relative;
  return null;
};

router.get('/:fileId', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT file_path, original_name FROM document_files WHERE document_file_id = $1', [req.params.fileId]);
    if (!rows.length) return res.status(404).send('File not found');
    const file = rows[0];

    if (String(file.file_path).startsWith('http')) return res.redirect(file.file_path);
    const resolvedPath = resolveLocalPath(file.file_path);
    if (!resolvedPath) return res.status(404).send('File not found on server');

    const contentType = mime.lookup(resolvedPath) || 'application/octet-stream';
    res.set('Content-Type', contentType);
    res.download(resolvedPath, file.original_name || path.basename(resolvedPath));
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).send('Error downloading file');
  }
});

module.exports = router;