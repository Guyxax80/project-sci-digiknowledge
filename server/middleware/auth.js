// middleware/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = "yoursecretkey"; // ใช้เดียวกับ login

module.exports = function(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: "กรุณา login" });

  const token = authHeader.split(" ")[1]; // Bearer token
  if (!token) return res.status(401).json({ success: false, message: "กรุณา login" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // ใส่ข้อมูล user ลง req.user
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token ไม่ถูกต้อง" });
  }
};
