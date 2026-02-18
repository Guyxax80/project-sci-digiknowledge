const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT categorie_id, name FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('DB error (categories):', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงหมวดหมู่' });
  }
});

module.exports = router;