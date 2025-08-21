const express = require("express");
const router = express.Router();
const db = require("../db"); // ใช้ connection MySQL
const { exec } = require("child_process");
const path = require("path");

// 📌 ดึงผู้ใช้ทั้งหมด
router.get("/users", (req, res) => {
  db.query("SELECT id, username, role, created_at FROM users", (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(result);
  });
});

// 📌 เพิ่มผู้ใช้
router.post("/users", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });

  db.query(
    "INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, NOW())",
    [username, password, role],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB insert error" });
      res.json({ message: "เพิ่มผู้ใช้สำเร็จ" });
    }
  );
});

// 📌 แก้ไขผู้ใช้
router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;

  db.query(
    "UPDATE users SET username=?, role=? WHERE id=?",
    [username, role, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB update error" });
      res.json({ message: "อัปเดตผู้ใช้สำเร็จ" });
    }
  );
});

// 📌 ลบผู้ใช้
router.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM users WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "DB delete error" });
    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  });
});

// 📌 ดึงสถิติ
router.get("/stats", (req, res) => {
  const stats = {};

  db.query("SELECT COUNT(*) AS total FROM documents", (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    stats.documents = result[0].total;

    db.query(
      "SELECT SUM(download_count) AS total FROM documents",
      (err2, result2) => {
        if (err2) return res.status(500).json({ error: "DB error" });
        stats.downloads = result2[0].total || 0;

        db.query("SELECT COUNT(*) AS total FROM users", (err3, result3) => {
          if (err3) return res.status(500).json({ error: "DB error" });
          stats.users = result3[0].total;

          res.json(stats);
        });
      }
    );
  });
});

// 📌 สำรองฐานข้อมูล (mysqldump)
router.get("/backup", (req, res) => {
  const backupPath = path.join(__dirname, "../backup.sql");
  const command = `mysqldump -u root -p1234 your_database_name > ${backupPath}`;

  exec(command, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Backup failed");
    }
    res.download(backupPath);
  });
});

module.exports = router;
