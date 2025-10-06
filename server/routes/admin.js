const express = require("express");
const router = express.Router();
const db = require("../db"); // ใช้ connection MySQL
const { exec } = require("child_process");
const path = require("path");
const util = require("util");
const q = util.promisify(db.query).bind(db);

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
router.get("/stats", async (req, res) => {
  try {
    const stats = {};

    // รวมจำนวนผู้ใช้/เอกสาร/ดาวน์โหลด (ดาวน์โหลดล้มเหลวถือเป็น 0)
    const usersRows = await q("SELECT COUNT(*) AS total FROM users");
    stats.users = usersRows[0]?.total || 0;

    const docRows = await q("SELECT COUNT(*) AS total FROM documents");
    stats.documents = docRows[0]?.total || 0;

    // ดาวน์โหลดรวม: ใช้ผลรวมจาก documents.download_count (เชื่อถือได้กว่า)
    const dlSumRows = await q("SELECT COALESCE(SUM(download_count), 0) AS total FROM documents");
    stats.downloads = dlSumRows[0]?.total || 0;

    // อัปโหลด 7 วันล่าสุด — ลอง uploaded_at ก่อน, ถ้าไม่มีใช้ created_at
    let uploadsRows = [];
    try {
      uploadsRows = await q(`
        SELECT DATE(uploaded_at) AS day, COUNT(*) AS count
        FROM documents
        WHERE uploaded_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(uploaded_at)
        ORDER BY day ASC`);
    } catch (_) {
      try {
        uploadsRows = await q(`
          SELECT DATE(created_at) AS day, COUNT(*) AS count
          FROM documents
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at)
          ORDER BY day ASC`);
      } catch (_) {
        uploadsRows = [];
      }
    }
    stats.uploadsLast7Days = uploadsRows || [];

    // หมวดหมู่ยอดนิยม — รองรับทั้ง categories/categorie และ (categorie_id/category_id)
    const catQueries = [
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categories c ON c.categorie_id = dc.categorie_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`,
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categories c ON c.category_id = dc.category_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`,
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categorie c ON c.categorie_id = dc.categorie_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`,
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categorie c ON c.category_id = dc.category_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`
    ];
    let topCategories = [];
    for (const sql of catQueries) {
      try {
        const rows = await q(sql);
        if (rows && rows.length) { topCategories = rows; break; }
      } catch (_) {}
    }
    stats.topCategories = topCategories;

    // ผู้ใช้ตามบทบาท
    const roleRows = await q("SELECT role, COUNT(*) AS count FROM users GROUP BY role");
    stats.usersByRole = roleRows || [];

    return res.json(stats);
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ error: "DB error" });
  }
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
