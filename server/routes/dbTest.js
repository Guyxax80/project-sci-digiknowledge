const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/db-test', (req, res) => {
  db.query('SELECT NOW() AS time', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

module.exports = router;
