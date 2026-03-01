// server.js

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const uploadRoute = require("./routes/upload");
const documentRoute = require("./routes/documents");
const approvalsRoute = require("./routes/approvals");
const adminRoutes = require("./routes/admin");
const downloadRoute = require("./routes/download");
const loginRoute = require("./routes/login");
const signupRoute = require("./routes/signup");
const authRoute = require("./routes/auth");
const filesRoute = require("./routes/files");
const sectionFilesRoute = require("./routes/sectionFiles");
const categoriesRoute = require("./routes/categories");
const dbTestRoute = require("./routes/dbTest");
const profileRoute = require("./routes/profile");
const studentCodesRoute = require("./routes/studentCodes");

const app = express();

// ✅ สำคัญบน Render/Reverse proxy (เพื่อ rateLimit/req.ip ถูกต้อง)
app.set("trust proxy", 1);

// ===== CORS Allowlist (env + hardcoded) =====
const envAllowlist = String(process.env.CORS_ALLOWLIST || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",

  // ✅ PROD frontends
  process.env.FRONTEND_URL, // แนะนำให้ตั้งเป็น https://project-sci-digiknowledge.vercel.app
  "https://project-sci-digiknowledge.vercel.app", // ✅ ตัวจริงบน Vercel
  "https://project-sci-digiknowledge1.onrender.com",
  "https://www.sci-digiknowledge.com",

  ...envAllowlist,
].filter(Boolean);

// ✅ รองรับ Vercel preview: https://<branch>.<project>.vercel.app
function isAllowedVercel(origin) {
  return /^https:\/\/([a-z0-9-]+\.)?project-sci-digiknowledge\.vercel\.app$/.test(origin);
}

const corsOptions = {
  origin(origin, callback) {
    // allow curl/postman/no-origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || isAllowedVercel(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ Helmet (แก้ NotSameOrigin / CORP)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ✅ Rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 500),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ✅ CORS ต้องมาก่อน routes เสมอ
app.use(cors(corsOptions));

/**
 * ✅ Express 5 + path-to-regexp:
 * ห้ามใช้ app.options("*", ...) เพราะ wildcard แบบไม่มีชื่อทำให้พังได้
 * ให้ใช้ named wildcard แทน
 */
app.options("/{*splat}", cors(corsOptions)); // ✅ ครอบคลุมทุก path (รวม /)

// body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Static uploads (ถ้ายังใช้ local uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/**
 * ✅ เพิ่ม header เฉพาะ route ที่เป็นไฟล์ (กัน browser block)
 */
app.use(["/files", "/uploads"], (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// ===== Routes =====
app.use("/api/upload", uploadRoute);
app.use("/api/documents", documentRoute);
app.use("/api/approvals", approvalsRoute);
app.use("/api/login", loginRoute);
app.use("/api/signup", signupRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api/profile", profileRoute);
app.use("/api/teacher", require("./routes/teacher"));
app.use("/api/student-codes", studentCodesRoute);

// ✅ แยก prefix ชัด ๆ ไม่ชน /api/documents
app.use("/api/section-files", sectionFilesRoute);

app.use("/files", filesRoute);
app.use("/download", downloadRoute);
app.use("/api/db-test", dbTestRoute);

app.get("/", (_req, res) => {
  res.send("Welcome to the API server");
});

// ===== Error handler =====
app.use((err, req, res, _next) => {
  const requestOrigin = req.headers.origin;

  // ✅ ถ้า origin ได้รับอนุญาต ให้คืน CORS headers ด้วย (รวม error)
  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || isAllowedVercel(requestOrigin))) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  console.error("Unhandled error:", err?.message || err);

  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS origin denied" });
  }

  return res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});