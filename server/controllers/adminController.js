const db = require("../db");
const { exec } = require("child_process");
const path = require("path");

// ดึงรายชื่อผู้ใช้
exports.getUsers = (req, res) => {
  const sql = "SELECT id, name, email, role FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "ดึงข้อมูลผู้ใช้ล้มเหลว" });
    }
    res.json(results);
  });
};

// ลบผู้ใช้
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ error: "ลบผู้ใช้ล้มเหลว" });
    }
    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  });
};

// ดึงสถิติ
exports.getStats = (req, res) => {
  const stats = {};
  db.query("SELECT COUNT(*) AS totalDocs FROM documents", (err, docResult) => {
    if (err) {
      return res.status(500).json({ error: "โหลดสถิติล้มเหลว" });
    }
    stats.documents = docResult[0].totalDocs;

    db.query("SELECT SUM(download_count) AS totalDownloads FROM documents", (err, dlResult) => {
      if (err) {
        return res.status(500).json({ error: "โหลดสถิติล้มเหลว" });
      }
      stats.downloads = dlResult[0].totalDownloads || 0;
      res.json(stats);
    });
  });
};

// สำรองฐานข้อมูล
exports.backupDatabase = (req, res) => {
  const backupPath = path.join(__dirname, "../uploads", "backup.sql");
  const command = `mysqldump -u root sci_digiknowledge > "${backupPath}"`; // ปรับ user/password ตามเครื่อง

  exec(command, (err) => {
    if (err) {
      console.error("Backup error:", err);
      return res.status(500).json({ error: "สำรองฐานข้อมูลล้มเหลว" });
    }
    res.download(backupPath, "backup.sql");
  });
};
