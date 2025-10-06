const express = require("express");
const router = express.Router();
const db = require("../db"); // ใช้ connection MySQL
const { exec } = require("child_process");
const path = require("path");
const util = require("util");
const q = util.promisify(db.query).bind(db);

// 📌 ดึงผู้ใช้ทั้งหมด
router.get("/users", (req, res) => {
  db.query(
    "SELECT user_id, username, role, created_at FROM users",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    }
  );
});

// 📌 เพิ่มผู้ใช้
router.post("/users", (req, res) => {
  const { username, password, role, student_id } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });

  db.query(
    "INSERT INTO users (username, student_id, password, role) VALUES (?, ?, ?, ?)",
    [username, student_id || null, password, role],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB insert error" });
      res.json({ message: "เพิ่มผู้ใช้สำเร็จ" });
    }
  );
});

// 📌 แก้ไขผู้ใช้
router.put("/users/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { username, role } = req.body;

  db.query(
    "UPDATE users SET username=?, role=? WHERE user_id=?",
    [username, role, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB update error" });
      res.json({ message: "อัปเดตผู้ใช้สำเร็จ" });
    }
  );
});

// 📌 ลบผู้ใช้
router.delete("/users/:user_id", (req, res) => {
  const { user_id } = req.params;

  db.query("DELETE FROM users WHERE user_id=?", [user_id], (err, result) => {
    if (err) return res.status(500).json({ error: "DB delete error" });
    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  });
});

// 📌 ดึงสถิติ
router.get("/stats", async (req, res) => {
  try {
    const stats = {};

    // รวมจำนวนผู้ใช้/เอกสาร/ดาวน์โหลด (ดาวน์โหลดล้มเหลวถือเป็น 0)
    const usersRows = await q("SELECT COUNT(*) AS total FROM users");
    stats.users = usersRows[0]?.total || 0;

    const docRows = await q("SELECT COUNT(*) AS total FROM documents");
    stats.documents = docRows[0]?.total || 0;

    // ดาวน์โหลดรวม: ใช้ผลรวมจาก documents.download_count (เชื่อถือได้กว่า)
    const dlSumRows = await q("SELECT COALESCE(SUM(download_count), 0) AS total FROM documents");
    stats.downloads = dlSumRows[0]?.total || 0;

    // อัปโหลด 7 วันล่าสุด — ลอง uploaded_at ก่อน, ถ้าไม่มีใช้ created_at
    let uploadsRows = [];
    try {
      uploadsRows = await q(`
        SELECT DATE(uploaded_at) AS day, COUNT(*) AS count
        FROM documents
        WHERE uploaded_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(uploaded_at)
        ORDER BY day ASC`);
    } catch (_) {
      try {
        uploadsRows = await q(`
          SELECT DATE(created_at) AS day, COUNT(*) AS count
          FROM documents
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at)
          ORDER BY day ASC`);
      } catch (_) {
        uploadsRows = [];
      }
    }
    stats.uploadsLast7Days = uploadsRows || [];

    // หมวดหมู่ยอดนิยม — รองรับทั้ง categories/categorie และ (categorie_id/category_id)
    const catQueries = [
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categories c ON c.categorie_id = dc.categorie_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`,
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categories c ON c.category_id = dc.category_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`,
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categorie c ON c.categorie_id = dc.categorie_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`,
      `SELECT c.name AS category, COUNT(*) AS count
       FROM document_categories dc JOIN categorie c ON c.category_id = dc.category_id
       GROUP BY c.name ORDER BY count DESC LIMIT 5`
    ];
    let topCategories = [];
    for (const sql of catQueries) {
      try {
        const rows = await q(sql);
        if (rows && rows.length) { topCategories = rows; break; }
      } catch (_) {}
    }
    stats.topCategories = topCategories;

    // ผู้ใช้ตามบทบาท
    const roleRows = await q("SELECT role, COUNT(*) AS count FROM users GROUP BY role");
    stats.usersByRole = roleRows || [];

    // รายการไฟล์ยอดดาวน์โหลด: รวมจาก document_files.download_count
    const topFiles = await q(`
      SELECT 
        df.document_file_id,
        df.document_id,
        df.section,
        df.original_name,
        COALESCE(df.download_count, 0) AS download_count,
        d.title
      FROM document_files df
      JOIN documents d ON d.document_id = df.document_id
      WHERE COALESCE(df.download_count, 0) > 0
      ORDER BY df.download_count DESC, df.document_file_id ASC
      LIMIT 20
    `);
    stats.topFiles = topFiles || [];

    // เอกสารยอดดาวน์โหลด (ตาม documents.download_count)
    const topDocuments = await q(`
      SELECT document_id, title, COALESCE(download_count, 0) AS download_count
      FROM documents
      WHERE COALESCE(download_count, 0) > 0
      ORDER BY download_count DESC, uploaded_at DESC
      LIMIT 20
    `);
    stats.topDocuments = topDocuments || [];

    return res.json(stats);
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ error: "DB error" });
  }
});

// GET /api/admin/documents/:documentId/file-downloads - ไฟล์ของเอกสารและยอดดาวน์โหลดต่อไฟล์ (>0)
router.get("/documents/:documentId/file-downloads", async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const rows = await q(
      `SELECT document_file_id, section, original_name, COALESCE(download_count, 0) AS download_count
       FROM document_files
       WHERE document_id = ? AND COALESCE(download_count, 0) > 0
       ORDER BY download_count DESC, document_file_id ASC`,
      [documentId]
    );
    return res.json(rows || []);
  } catch (err) {
    console.error("Admin file downloads error:", err);
    return res.status(500).json({ error: "DB error" });
  }
});

// 📌 สำรองฐานข้อมูล (mysqldump)
router.get("/backup", (req, res) => {
  // สร้างไฟล์ zip รวม: backup.sql + โฟลเดอร์ uploads
  const dbName = 'sci_digiknowledge';
  const dbUser = 'root';
  const dbPass = '';

  const tmpDir = path.join(__dirname, '..', 'tmp_backup');
  const sqlPath = path.join(tmpDir, 'backup.sql');
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const zipPath = path.join(tmpDir, `backup_all_${Date.now()}.zip`);

  const fs = require('fs');
  const archiver = require('archiver');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // ใช้ไลบรารี mysqldump (Node) แทนคำสั่งระบบ
  const { dump } = require('mysqldump');
  dump({
    connection: {
      host: 'localhost',
      user: dbUser,
      password: dbPass,
      database: dbName,
    },
    dumpToFile: sqlPath,
  }).then(() => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, (dlErr) => {
        if (dlErr) console.warn('Download backup failed:', dlErr);
        try { fs.unlinkSync(sqlPath); } catch (_) {}
        try { fs.unlinkSync(zipPath); } catch (_) {}
      });
    });
    archive.on('error', (zipErr) => {
      console.error('Zip error:', zipErr);
      try { fs.unlinkSync(sqlPath); } catch (_) {}
      return res.status(500).send('Zip failed');
    });

    archive.pipe(output);
    archive.file(sqlPath, { name: 'backup.sql' });
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }
    archive.finalize();
  }).catch((e) => {
    console.error('mysqldump lib failed:', e);
    return res.status(500).send('Backup failed');
  });
});

module.exports = router;
