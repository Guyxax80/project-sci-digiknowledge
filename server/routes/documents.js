const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.query('SELECT * FROM documents', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาด:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
    res.json(results);
  });
});

module.exports = router;