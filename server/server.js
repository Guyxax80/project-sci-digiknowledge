const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRoute = require('./routes/upload');
const documentRoute = require('./routes/documents'); // เพิ่มตรงนี้
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', adminRoutes);

// Route สำหรับอัปโหลดไฟล์
app.use('/api/upload', uploadRoute);

// Route สำหรับดึงเอกสารทั้งหมด
app.use('/documents', documentRoute);  // เพิ่มบรรทัดนี้

app.get('/', (req, res) => {
  res.send('Welcome to the API server');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

const downloadRoute = require('./routes/download');
app.use('/download', downloadRoute);
