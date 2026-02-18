const express = require("express");
const multer = require("multer");
const db = require("../db");
const cloudinary = require("../cloudinary");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, keywords, academic_year, user_id, status } = req.body;
    const file = req.file;

    const safeStatus = status === "published" ? "pending" : (status || "draft");

    // 1️⃣ INSERT DOCUMENT
    const docSql = `
      INSERT INTO documents
      (user_id, title, keywords, academic_year, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING document_id
    `;

    const { rows } = await db.query(docSql, [
      user_id,
      title,
      keywords,
      academic_year,
      safeStatus
    ]);

    const documentId = rows[0].document_id;

    // 2️⃣ ถ้ามีไฟล์ → อัปขึ้น Cloudinary
    if (file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "documents"
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      const fileSql = `
        INSERT INTO document_files
        (document_id, file_path, original_name, file_type, section)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await db.query(fileSql, [
        documentId,
        uploadResult.secure_url,
        file.originalname,
        file.mimetype,
        "main"
      ]);
    }

    res.json({ message: "อัปโหลดสำเร็จ", documentId });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;