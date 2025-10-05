const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/categories - ดึงรายการหมวดหมู่ทั้งหมดจากตาราง categories
router.get('/', (req, res) => {
  const queries = [
    'SELECT categorie_id, name FROM categories ORDER BY name ASC',
    'SELECT category_id AS categorie_id, name FROM categories ORDER BY name ASC',
    'SELECT categorie_id, name FROM categorie ORDER BY name ASC',
    'SELECT category_id AS categorie_id, name FROM categorie ORDER BY name ASC'
  ];

  const tryQuery = (index = 0) => {
    if (index >= queries.length) {
      console.error('DB error (categories): all attempts failed');
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงหมวดหมู่' });
    }
    db.query(queries[index], (err, rows) => {
      if (err) {
        console.error('DB error (categories attempt):', err);
        return tryQuery(index + 1);
      }
      return res.json(rows);
    });
  };

  tryQuery(0);
});

module.exports = router;
