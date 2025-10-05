const express = require("express");
const router = express.Router();
const db = require("../db"); // ใช้ connection MySQL
const { exec } = require("child_process");
const path = require("path");

// 📌 ดึงผู้ใช้ทั้งหมด
router.get("/users", (req, res) => {
  db.query(
    "SELECT user_id, username, role, created_at FROM users",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    }
  );
});

// 📌 เพิ่มผู้ใช้
router.post("/users", (req, res) => {
  const { username, password, role, student_id } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });

  db.query(
    "INSERT INTO users (username, student_id, password, role) VALUES (?, ?, ?, ?)",
    [username, student_id || null, password, role],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB insert error" });
      res.json({ message: "เพิ่มผู้ใช้สำเร็จ" });
    }
  );
});

// 📌 แก้ไขผู้ใช้
router.put("/users/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { username, role } = req.body;

  db.query(
    "UPDATE users SET username=?, role=? WHERE user_id=?",
    [username, role, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB update error" });
      res.json({ message: "อัปเดตผู้ใช้สำเร็จ" });
    }
  );
});

// 📌 ลบผู้ใช้
router.delete("/users/:user_id", (req, res) => {
  const { user_id } = req.params;

  db.query("DELETE FROM users WHERE user_id=?", [user_id], (err, result) => {
    if (err) return res.status(500).json({ error: "DB delete error" });
    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  });
});

// 📌 ดึงสถิติ
router.get("/stats", (req, res) => {
  const stats = {};
  db.query("SELECT COUNT(*) AS total FROM users", (e1, r1) => {
    if (e1) return res.status(500).json({ error: "DB error" });
    stats.users = r1[0]?.total || 0;

    db.query("SELECT COUNT(*) AS total FROM documents", (e2, r2) => {
      if (e2) return res.status(500).json({ error: "DB error" });
      stats.documents = r2[0]?.total || 0;

      db.query("SELECT COUNT(*) AS total FROM downloads", (e3, r3) => {
        if (e3) return res.status(500).json({ error: "DB error" });
        stats.downloads = r3[0]?.total || 0;

        // ยอดอัปโหลดรายวัน 7 วันล่าสุด
        const uploadsSql = `
          SELECT DATE(uploaded_at) AS day, COUNT(*) AS count
          FROM documents
          WHERE uploaded_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(uploaded_at)
          ORDER BY day ASC`;

        db.query(uploadsSql, (e4, r4) => {
          if (e4) return res.status(500).json({ error: "DB error" });
          stats.uploadsLast7Days = r4 || [];

          // เอกสารตามหมวดหมู่ Top 5
          const byCatSql = `
            SELECT c.name AS category, COUNT(*) AS count
            FROM document_categories dc
            JOIN categories c ON c.categorie_id = dc.categorie_id
            GROUP BY c.name
            ORDER BY count DESC
            LIMIT 5`;

          db.query(byCatSql, (e5, r5) => {
            if (e5) return res.status(500).json({ error: "DB error" });
            stats.topCategories = r5 || [];

            // ผู้ใช้ตามบทบาท
            db.query(
              "SELECT role, COUNT(*) AS count FROM users GROUP BY role",
              (e6, r6) => {
                if (e6) return res.status(500).json({ error: "DB error" });
                stats.usersByRole = r6 || [];
                return res.json(stats);
              }
            );
          });
        });
      });
    });
  });
});

// 📌 สำรองฐานข้อมูล (mysqldump)
router.get("/backup", (req, res) => {
  const backupPath = path.join(__dirname, "../backup.sql");
  const command = `mysqldump -u root -p1234 sci_digiknowledge > ${backupPath}`;

  exec(command, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Backup failed");
    }
    res.download(backupPath);
  });
});

module.exports = router;
