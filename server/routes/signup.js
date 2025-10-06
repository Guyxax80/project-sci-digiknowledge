const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const util = require("util");

// Promisify db.query for async/await usage
const query = util.promisify(db.query).bind(db);

router.post("/", async (req, res) => {
  const { username, student_id, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  try {
    // ตรวจสอบ username ซ้ำ
    const existingUsers = await query("SELECT * FROM users WHERE username = ?", [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
    }

    // Debug: แสดงรหัสผ่านก่อนเข้ารหัส
    console.log("รหัสผ่านเดิม:", password);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("รหัสผ่านที่เข้ารหัส:", hashedPassword);

    let role = "teacher";
    let validStudentId = null;

    if (student_id) {
      const studentRows = await query("SELECT * FROM student_codes WHERE student_id = ?", [student_id]);
      if (studentRows.length > 0) {
        role = "student";
        validStudentId = student_id;
      }
    }

    // บันทึกลงฐานข้อมูล
    await query(
      "INSERT INTO users (username, student_id, password, role) VALUES (?, ?, ?, ?)",
      [username, validStudentId, hashedPassword, role]
    );

    res.json({ success: true, message: "สมัครสมาชิกสำเร็จ", role });
  } catch (err) {
    console.error("Signup error:", err.sqlMessage || err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" });
  }
});

module.exports = router;