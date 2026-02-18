const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/db-test', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT NOW() AS time, 1 AS ok');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;