const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const uploadController = require("../controllers/uploadController");

// ใช้ diskStorage เก็บไฟล์ใน uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder หลัก
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// กำหนด field สำหรับแต่ละ section
const sections = [
  "ปก",
  "บทคัดย่อ",
  "กิตติกรรมประกาศ",
  "สารบัญ",
  "บทที่1",
  "บทที่2",
  "บทที่3",
  "บทที่4",
  "บทที่5",
  "บรรณานุกรม",
  "ภาคผนวก",
  "ประวัติผู้จัดทำปริญญานิพนธ์",
];

const sectionFields = sections.map((s) => ({ name: `files[${s}]`, maxCount: 1 }));

// ใช้ upload.fields() แทน single
router.post("/", upload.fields(sectionFields), uploadController.uploadFile);

module.exports = router;
