const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql connection ธรรมดา
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "yoursecretkey"; // ⚠️ เก็บใน .env จริง ๆ

router.post("/", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  // ดึง user จากฐานข้อมูล
 db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
  if (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" });
  }

  if (!results || results.length === 0) {
    return res.status(401).json({ success: false, message: "ไม่พบชื่อผู้ใช้" });
  }

  const user = results[0];
  let match = false;

  try {
    if (user.password.startsWith("$2b$")) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = password === user.password;
      if (match) {
        const hashed = await bcrypt.hash(password, 10);
        db.query(
          "UPDATE users SET password = ? WHERE user_id = ?",
          [hashed, user.user_id],
          (err2) => {
            if (err2) console.error(err2);
            else console.log(`อัปเดตรหัสผ่าน user_id=${user.user_id} → hash แล้ว`);
          }
        );
      }
    }

    if (!match) {
      return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      role: user.role,
      token,
      userId: user.user_id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" });
  }
});
});

module.exports = router;
 
