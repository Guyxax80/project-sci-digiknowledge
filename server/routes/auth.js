const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "yoursecretkey"; // ⚠️ ควรเก็บใน .env

// helper query
const query = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// Middleware ตรวจสอบ JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res
        .status(403)
        .json({ success: false, message: "Token invalid or expired" });
    req.user = user; // { user_id, username, role }
    next();
  });
}

// Route ดึงข้อมูลโปรไฟล์
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const results = await query(
      "SELECT user_id, username, student_id, role, created_at, class_group, level FROM users WHERE user_id = ?",
      [req.user.user_id]   // ✅ ใช้ user_id ไม่ใช่ id
    );

    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });

    res.json({ success: true, user: results[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" });
  }
});


module.exports = router;
 
// ===================== Forgot/Reset Password =====================
// ส่งโค้ดรีเซ็ตรหัสผ่าน (OTP 6 หลัก) ไปยังผู้ใช้ (เดโม: ส่งกลับใน response)
router.post("/forgot-password", (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ success: false, message: "กรุณาระบุชื่อผู้ใช้" });

  db.query("SELECT user_id FROM users WHERE username = ? LIMIT 1", [username], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" });
    if (!rows || !rows.length) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    const userId = rows[0].user_id;

    const createSql = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(16) NOT NULL,
        expires_at DATETIME NOT NULL,
        INDEX (user_id),
        INDEX (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

    db.query(createSql, (cErr) => {
      if (cErr) return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" });
      const token = (Math.floor(100000 + Math.random() * 900000)).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      db.query(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [userId, token, expires],
        (iErr) => {
          if (iErr) return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" });
          // เดโม: ส่ง code กลับ (จริงควรส่งอีเมล/ช่องทางอื่น)
          return res.json({ success: true, message: "ส่งรหัสรีเซ็ตสำเร็จ", code: token });
        }
      );
    });
  });
});

// รีเซ็ตรหัสผ่าน
router.post("/reset-password", async (req, res) => {
  const { username, code, new_password } = req.body || {};
  if (!username || !code || !new_password) return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบ" });
  try {
    const users = await query("SELECT user_id FROM users WHERE username = ? LIMIT 1", [username]);
    if (!users || !users.length) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    const userId = users[0].user_id;
    const tokens = await query(
      "SELECT token_id, expires_at FROM password_reset_tokens WHERE user_id = ? AND token = ? ORDER BY token_id DESC LIMIT 1",
      [userId, code]
    );
    if (!tokens || !tokens.length) return res.status(400).json({ success: false, message: "รหัสไม่ถูกต้อง" });
    const expiresAt = new Date(tokens[0].expires_at);
    if (Date.now() > expiresAt.getTime()) return res.status(400).json({ success: false, message: "รหัสหมดอายุ" });

    const hashed = await bcrypt.hash(new_password, 10);
    await query("UPDATE users SET password = ? WHERE user_id = ?", [hashed, userId]);
    await query("DELETE FROM password_reset_tokens WHERE user_id = ?", [userId]);
    return res.json({ success: true, message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" });
  }
});
 
