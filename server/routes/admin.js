const express = require('express');
const db = require('../db');
const router = express.Router();

// ดึงข้อมูลผู้ใช้งานทั้งหมด
router.get('/users', (req, res) => {
  db.query('SELECT id, username, role, created_at FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: 'ดึงข้อมูลผู้ใช้ล้มเหลว' });
    res.json(results);
  });
});

// 📌 POST: เพิ่มผู้ใช้ใหม่
router.post("/users", (req, res) => {
  console.log(req.body); // เพิ่มบรรทัดนี้เพื่อตรวจสอบข้อมูล
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }
  const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
  db.query(sql, [username, password, role], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "เพิ่มผู้ใช้สำเร็จ", id: result.insertId });
  });
});


// 📌 PUT: แก้ไขข้อมูลผู้ใช้ (แก้ไขให้รองรับ password)
router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  const sql = "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?";
  db.query(sql, [username, password, role, id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "อัปเดตข้อมูลผู้ใช้สำเร็จ" });
  });
});

// ลบผู้ใช้
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'ลบผู้ใช้ล้มเหลว' });
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  });
});

// ดึงสถิติระบบ
router.get('/stats', (req, res) => {
  const stats = {};
  db.query('SELECT COUNT(*) AS total_documents FROM documents', (err, docResult) => {
    if (err) return res.status(500).json({ error: 'ดึงสถิติเอกสารล้มเหลว' });

    stats.total_documents = docResult[0].total_documents;

    db.query('SELECT SUM(download_count) AS total_downloads FROM documents', (err, dlResult) => {
      if (err) return res.status(500).json({ error: 'ดึงสถิติการดาวน์โหลดล้มเหลว' });

      stats.total_downloads = dlResult[0].total_downloads || 0;
      res.json(stats);
    });
  });
});

// เพิ่ม GET /admin สำหรับตรวจสอบ API
router.get('/', (req, res) => {
  res.send('Admin API is ready');
});

module.exports = router;
