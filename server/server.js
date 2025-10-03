require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRouter = require('./routes/upload');
const documentRoute = require('./routes/documents');
const adminRoutes = require('./routes/admin');
const downloadRoute = require('./routes/download');
const loginRoute = require('./routes/login');   // เปลี่ยนชื่อให้ตรง
const signupRoute = require("./routes/signup");
const authRoute = require("./routes/auth");
const filesRoute = require('./routes/files');
const sectionFilesRoute = require('./routes/sectionFiles');
const uploadRoute = require("./routes/upload");

// ...ส่วนอื่น ๆ ของ server.js

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ตั้งค่า charset สำหรับ JSON response
app.use((req, res, next) => {
  res.charset = 'utf-8';
  next();
});

// หมายเหตุ: ห้ามบังคับ setEncoding กับ multipart/form-data เพราะจะทำให้ไฟล์ไบนารีเสียหาย
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.use("/api/upload-files", uploadRouter);


// Route สำหรับอัปโหลดไฟล์
app.use('/api/upload', uploadRoute);

app.use('/admin', adminRoutes);

// Route สำหรับดึงเอกสารทั้งหมด
app.use('/api/documents', documentRoute);

// Route สำหรับ login
app.use('/api/login', loginRoute);  // ✅ ใช้ loginRoute และกำหนด path เป็น /api/login

// Route สำหรับ download
app.use('/download', downloadRoute);

// Route สำหรับ signup
app.use("/api/signup", signupRoute);

app.use("/api/auth", authRoute);

app.use('/files', filesRoute);
app.use('/api', sectionFilesRoute);

app.get('/', (req, res) => {
  res.send('Welcome to the API server');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
