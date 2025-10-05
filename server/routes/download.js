// routes/download.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const db = require('../db');  // เชื่อมฐานข้อมูล

router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT file_path, original_name FROM documents WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('File not found');
    const { file_path, original_name } = results[0];

    // Normalize stored path and reduce to basename to ensure we resolve under uploads
    const storedPath = String(file_path || '').replace(/\\/g, '/').replace(/^\.\/?/, '');
    const baseName = path.basename(storedPath);
    const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
    let resolvedPath = path.join(uploadsRoot, baseName);

    // Fallback: try storedPath relative to project if default not found
    if (!fs.existsSync(resolvedPath)) {
      const altPath = path.join(__dirname, '..', storedPath);
      if (fs.existsSync(altPath)) {
        resolvedPath = altPath;
      }
    }

    // Final existence check
    if (!fs.existsSync(resolvedPath)) {
      console.error('Resolved path not found:', resolvedPath);
      return res.status(404).send('File not found on server');
    }

    // Set content type for better behavior when opened in browser
    const contentType = mime.lookup(resolvedPath) || 'application/octet-stream';
    res.set('Content-Type', contentType);

    res.download(resolvedPath, original_name || path.basename(resolvedPath), (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file');
      }
    });
  });
});

module.exports = router;