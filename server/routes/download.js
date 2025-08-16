// routes/download.js
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');  // เชื่อมฐานข้อมูล

router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT file_path, original_name FROM documents WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('File not found');
    const { file_path, original_name } = results[0];
    const filePath = path.join(__dirname, '..', file_path);
    res.download(filePath, original_name, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file');
      }
    });
  });
});

module.exports = router;
