const express = require("express");
const router = express.Router();
const db = require("../db");
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
 
