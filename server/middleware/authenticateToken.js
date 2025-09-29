const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkey";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "กรุณา login" });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Token ไม่ถูกต้องหรือหมดอายุ" });
    }

    // ใช้ user_id ตาม payload ที่ gen ตอน login
    req.user = {
      id: payload.user_id,  
      username: payload.username,
      role: payload.role,
    };

    next();
  });
}

module.exports = authenticateToken;
