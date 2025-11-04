const express = require("express");
const router = express.Router();
const db = require("../db"); // ใช้ connection MySQL
const { exec } = require("child_process");
const path = require("path");
const util = require("util");
const q = util.promisify(db.query).bind(db);
const connection = require("../db");
  
// 📌 ดึงผู้ใช้ทั้งหมด
router.get("/users", async (req, res) => {
  try {
    const result = await q("SELECT user_id, username, role, student_id, created_at FROM users");
    res.json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// 📌 เพิ่มผู้ใช้
router.post("/users", async (req, res) => {
  const { username, password, role, student_id } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });

  const insertUser = () => {
    db.query(
      "INSERT INTO users (username, student_id, password, role) VALUES (?, ?, ?, ?)",
      [username, student_id || null, password, role],
      (err) => {
        if (err) return res.status(500).json({ error: "DB insert error" });
        res.json({ message: "เพิ่มผู้ใช้สำเร็จ" });
      }
    );
  };

  // หากกำหนด student_id หรือ role เป็น student ให้ตรวจสอบตาราง student_codes
  if ((role === 'student' && !student_id)) {
    return res.status(400).json({ error: "กรุณาระบุ Student ID สำหรับนักศึกษา" });
  }
  if (student_id) {
    db.query(
      "SELECT 1 FROM student_codes WHERE student_id = ? LIMIT 1",
      [student_id],
      (chkErr, rows) => {
        if (chkErr) return res.status(500).json({ error: "DB error" });
        if (!rows || !rows.length) {
          return res.status(400).json({ error: "Student ID ไม่พบในระบบ" });
        }
        insertUser();
      }
    );
  } else {
    insertUser();
  }
});

// 📌 แก้ไขผู้ใช้
router.put("/users/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { username, role, student_id } = req.body;

  // อ่านค่า student_id เดิม เพื่อไม่ให้ถูกลบทิ้งโดยไม่ได้ตั้งใจ
  db.query(
    "SELECT student_id FROM users WHERE user_id = ? LIMIT 1",
    [user_id],
    (selErr, rows) => {
      if (selErr) return res.status(500).json({ error: "DB error" });
      if (!rows || !rows.length) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
      const currentStudentId = rows[0].student_id;

      // ถ้า body ไม่ส่ง student_id มาเลย ให้คงค่าเดิม
      const targetStudentId = (typeof student_id === 'undefined') ? currentStudentId : (student_id || null);

      const doUpdate = (finalStudentId) => {
        db.query(
          "UPDATE users SET username=?, role=?, student_id=? WHERE user_id=?",
          [username, role, finalStudentId, user_id],
          (updErr) => {
            if (updErr) return res.status(500).json({ error: "DB update error" });
            res.json({ message: "อัปเดตผู้ใช้สำเร็จ" });
          }
        );
      };

      // ถ้า role เป็น student แต่ไม่มี student_id ทั้งใหม่และเดิม ให้แจ้งเตือน
      if (role === 'student' && !targetStudentId) {
        return res.status(400).json({ error: "กรุณาระบุ Student ID สำหรับนักศึกษา" });
      }

      // หากมีการส่ง student_id ใหม่มา และยังไม่มีใน student_codes ให้เพิ่มให้อัตโนมัติ
      if (typeof student_id !== 'undefined' && student_id) {
        db.query(
          "SELECT 1 FROM student_codes WHERE student_id = ? LIMIT 1",
          [student_id],
          (chkErr, srows) => {
            if (chkErr) return res.status(500).json({ error: "DB error" });
            if (!srows || !srows.length) {
              db.query(
                "INSERT IGNORE INTO student_codes (student_id) VALUES (?)",
                [student_id],
                (insErr) => {
                  if (insErr) return res.status(500).json({ error: "DB error" });
                  doUpdate(student_id);
                }
              );
            } else {
              doUpdate(student_id);
            }
          }
        );
      } else {
        // ไม่ได้แก้ student_id ให้ใช้ค่าเดิม
        doUpdate(targetStudentId);
      }
    }
  );
});

// 📌 ลบผู้ใช้
router.delete("/users/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    // ตั้งค่า user_id ของผลงานทั้งหมดเป็น NULL ก่อน
    await connection.query("UPDATE documents SET user_id = NULL WHERE user_id = ?", [user_id]);

    // จากนั้นลบผู้ใช้
    await connection.query("DELETE FROM users WHERE user_id = ?", [user_id]);

    res.json({ message: "ลบผู้ใช้สำเร็จ (ผลงานยังอยู่)" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "ไม่สามารถลบผู้ใช้ได้" });
  }
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
  const fs = require('fs');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // ใช้ไลบรารี mysqldump (Node) แทนคำสั่งระบบ
  const mysqldump = require('mysqldump');
  mysqldump({
    connection: {
      host: 'localhost',
      user: dbUser,
      password: dbPass,
      database: dbName,
    },
    dumpToFile: sqlPath,
  }).then(() => {
    // ส่งไฟล์ SQL โดยตรง (ไม่ต้อง zip) เพื่อหลีกเลี่ยงการพึ่งพา archiver
    const downloadName = `backup_${Date.now()}.sql`;
    res.download(sqlPath, downloadName, (dlErr) => {
      if (dlErr) {
        console.warn('Download backup failed:', dlErr);
      }
      try { fs.unlinkSync(sqlPath); } catch (_) {}
    });
  }).catch((e) => {
    console.error('mysqldump lib failed:', e);
    return res.status(500).send('Backup failed');
  });
});

// 📌 จัดการ student_codes
// ดึงรายการรหัสนักศึกษา
router.get("/student-codes", (req, res) => {
  db.query(
    "SELECT student_code_id, student_id FROM student_codes ORDER BY student_code_id DESC",
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      return res.json(rows || []);
    }
  );
});

// เพิ่มรหัสนักศึกษา (รองรับหลายค่า คั่นด้วยบรรทัดใหม่หรือคอมมา)
router.post("/student-codes", (req, res) => {
  let { student_ids } = req.body;
  if (!student_ids) return res.status(400).json({ error: "กรุณาระบุ Student ID" });

  const normalize = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return [];
  };
  const ids = normalize(student_ids);
  if (ids.length === 0) return res.status(400).json({ error: "ไม่มี Student ID ที่เพิ่มได้" });

  // ใช้ INSERT IGNORE เพื่อข้ามค่าซ้ำโดยไม่ error (ต้องมี UNIQUE ที่ student_id)
  const placeholders = ids.map(() => "(?)").join(",");
  db.query(
    `INSERT IGNORE INTO student_codes (student_id) VALUES ${placeholders}`,
    ids,
    (err, result) => {
      if (err) {
        console.error("insert student_codes error:", err);
        return res.status(500).json({ error: "เพิ่มรหัสนักศึกษาไม่สำเร็จ" });
      }
      // result.affectedRows = จำนวนที่เพิ่มจริง (ไม่รวมที่ถูก ignore)
      return res.json({ success: true, inserted: result.affectedRows, totalSubmitted: ids.length });
    }
  );
});

// ลบรหัสนักศึกษา
router.delete("/student-codes/:student_code_id", (req, res) => {
  const { student_code_id } = req.params;
  db.query(
    "DELETE FROM student_codes WHERE student_code_id = ?",
    [student_code_id],
    (err) => {
      if (err) return res.status(500).json({ error: "DB delete error" });
      return res.json({ success: true });
    }
  );
});

module.exports = router;