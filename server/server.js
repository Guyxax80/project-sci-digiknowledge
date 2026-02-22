if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const uploadRoute = require('./routes/upload');
const documentRoute = require('./routes/documents');
const approvalsRoute = require('./routes/approvals');
const adminRoutes = require('./routes/admin');
const downloadRoute = require('./routes/download');
const loginRoute = require('./routes/login');
const signupRoute = require('./routes/signup');
const authRoute = require('./routes/auth');
const filesRoute = require('./routes/files');
const sectionFilesRoute = require('./routes/sectionFiles');
const categoriesRoute = require('./routes/categories');
const dbTestRoute = require('./routes/dbTest');
const profileRoute = require('./routes/profile');

const app = express();

// ✅ สำคัญบน Render/Reverse proxy (เพื่อ rateLimit/req.ip ถูกต้อง)
app.set('trust proxy', 1);

const envAllowlist = String(process.env.CORS_ALLOWLIST || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  'https://project-sci-digiknowledge1.onrender.com',
  'https://project-sci-digiknowledge.vercel.app',
  ...envAllowlist,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow curl/postman/no-origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// ✅ ปรับ helmet ไม่ให้บล็อก resource ข้าม origin (แก้ NotSameOrigin)
app.use(
  helmet({
    crossOriginResourcePolicy: false, // ปิด CORP ไปเลย
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

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Static uploads (ถ้าคุณยังใช้ local uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * ✅ เพิ่ม header เฉพาะ route ที่เป็นไฟล์ (กัน browser block)
 * (แม้ตั้ง helmet ไว้แล้ว อันนี้ช่วยชัวร์ขึ้น)
 */
app.use(['/files', '/uploads'], (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // ถ้าโหลด video แล้วมีปัญหา seek/stream ให้เปิด range
  // res.setHeader('Accept-Ranges', 'bytes');
  next();
});

// ===== Routes =====
app.use('/api/upload', uploadRoute);
app.use('/api/documents', documentRoute);
app.use('/api/approvals', approvalsRoute);
app.use('/api/login', loginRoute);
app.use('/api/signup', signupRoute);
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoute);
app.use('/api/profile', profileRoute);

// ⚠️ อันนี้น่าจะชน path เดิม (/api/documents)
// ถ้า sectionFilesRoute เป็น route แยก แนะนำเปลี่ยน prefix ชัด ๆ เช่น /api/section-files
app.use('/api/documents', sectionFilesRoute);

app.use('/files', filesRoute);
app.use('/download', downloadRoute);
app.use('/api/db-test', dbTestRoute);

app.get('/', (_req, res) => {
  res.send('Welcome to the API server');
});

app.use((err, req, res, _next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }

  console.error('Unhandled error:', err?.message || err);

  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS origin denied' });
  }

  return res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});