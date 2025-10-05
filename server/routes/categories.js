const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories - ดึงรายการหมวดหมู่ทั้งหมด
router.get('/', (req, res) => {
  db.query('SELECT categorie_id, name FROM categories ORDER BY name', (err, rows) => {
    if (err) {
      console.error('DB error (categories):', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงหมวดหมู่' });
    }
    res.json(rows);
  });
});

module.exports = router;
