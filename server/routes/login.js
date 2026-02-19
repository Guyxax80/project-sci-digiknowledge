const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const { username, password } = req.body || {};

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "JWT_SECRET not configured" });
  }
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  try {
    // ✅ ระบุ schema ให้ชัวร์
    const { rows } = await db.query(
      "SELECT user_id, username, password, role FROM public.users WHERE username = $1 LIMIT 1",
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: "ไม่พบชื่อผู้ใช้" });
    }

    const user = rows[0];

    let match = false;

    // ถ้าเป็น bcrypt hash
    if (String(user.password || "").startsWith("$2")) {
      match = await bcrypt.compare(password, user.password);
    } else {
      // เผื่อเคยมีรหัส plain text ในระบบเก่า
      match = password === user.password;

      // ถ้าตรงกัน ให้ upgrade เป็น hash
      if (match) {
        const hashed = await bcrypt.hash(password, 10);
        await db.query("UPDATE public.users SET password = $1 WHERE user_id = $2", [hashed, user.user_id]);
      }
    }

    if (!match) {
      return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      role: user.role,
      token,
      userId: user.user_id,
    });
  } catch (err) {
  console.error("Login error:", err);
  console.log("Server response:", err?.response?.data); // ✅ ดูสาเหตุจริง
  setIsLoading(false);
  setErrors({ password: err?.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่" });
}
});

module.exports = router;