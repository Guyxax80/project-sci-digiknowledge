const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/categories - ดึงรายการหมวดหมู่ทั้งหมดจากตาราง categories
router.get('/', (req, res) => {
  const sql = 'SELECT categorie_id, name FROM categories ORDER BY name ASC';
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('DB error (categories):', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงหมวดหมู่' });
    }
    return res.json(rows);
  });
});

module.exports = router;
