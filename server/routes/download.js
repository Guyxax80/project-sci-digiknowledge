const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const auth = require("../middleware/auth");
const db = require("../db");

// SQL migration snippets:
// ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;
// ALTER TABLE document_files ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;

const resolveLocalPath = (storedPath) => {
  const normalized = String(storedPath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\/?/, "");

  const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");
  const byName = path.join(uploadsRoot, path.basename(normalized));
  if (fs.existsSync(byName)) return byName;

  const relative = path.join(__dirname, "..", normalized);
  if (fs.existsSync(relative)) return relative;

  return null;
};

router.get("/:fileId", auth, async (req, res) => {
  try {
    // ✅ อัปเดตนับดาวน์โหลด "ไฟล์ + เอกสาร" ในคำสั่งเดียว (กัน 302 ตัดกลางคัน)
    const { rows } = await db.query(
      `
      WITH updated_file AS (
        UPDATE document_files
        SET download_count = COALESCE(download_count, 0) + 1
        WHERE document_file_id = $1
        RETURNING document_id, file_path, original_name
      ),
      updated_doc AS (
        UPDATE documents d
        SET download_count = COALESCE(d.download_count, 0) + 1
        FROM updated_file uf
        WHERE d.document_id = uf.document_id
        RETURNING d.document_id
      )
      SELECT uf.file_path, uf.original_name, uf.document_id
      FROM updated_file uf
      `,
      [req.params.fileId]
    );

    if (!rows.length) return res.status(404).send("File not found");

    const file = rows[0];

    // ✅ ถ้าเป็น URL (Supabase public URL / Cloud URL) ให้ redirect ไปเลย
    if (String(file.file_path).startsWith("http")) {
      return res.redirect(302, file.file_path);
    }

    // ✅ ถ้าเป็นไฟล์ในเครื่อง server
    const resolvedPath = resolveLocalPath(file.file_path);
    if (!resolvedPath) return res.status(404).send("File not found on server");

    const contentType = mime.lookup(resolvedPath) || "application/octet-stream";
    res.set("Content-Type", contentType);

    return res.download(resolvedPath, file.original_name || path.basename(resolvedPath));
  } catch (err) {
    console.error("DB error downloading file:", {
      message: err.message,
      code: err.code,
      detail: err.detail || null,
    });
    return res.status(500).send("Error downloading file");
  }
});

module.exports = router;