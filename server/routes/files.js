const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const auth = require("../middleware/auth");

const recentDownloadMarks = new Map();
const shouldCountDownloadOnce = (fileId, ip) => {
  const key = `${fileId}:${ip || ""}`;
  const now = Date.now();
  const last = recentDownloadMarks.get(key) || 0;
  if (now - last < 3000) return false;
  recentDownloadMarks.set(key, now);
  return true;
};

const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

// กัน header filename พัง
const safeFilename = (name, fallback) => {
  const s = String(name || fallback || "file").replace(/["\r\n]/g, "");
  return s.length ? s : "file";
};

// ให้หาไฟล์ใน uploads ได้แน่นอน
const resolveLocalPath = (storedPath) => {
  const normalized = String(storedPath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\/?/, "")
    .replace(/^\/+/, "");

  const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");

  // 1) ถ้าเก็บเป็นชื่อไฟล์อย่างเดียว
  const byName = path.join(uploadsRoot, path.basename(normalized));
  if (fs.existsSync(byName)) return byName;

  // 2) ถ้าเก็บเป็น uploads/xxx.pdf หรือ server/uploads/xxx.pdf
  const relative = path.join(__dirname, "..", normalized);
  if (fs.existsSync(relative)) return relative;

  // 3) กัน traversal
  const abs = path.resolve(__dirname, "..", normalized);
  const uploadsAbs = path.resolve(uploadsRoot);
  if (abs.startsWith(uploadsAbs) && fs.existsSync(abs)) return abs;

  return null;
};

// proxy URL -> stream กลับมาที่ client (สำคัญมากสำหรับ react-pdf)
async function proxyUrlToResponse(url, res, { inline = true, filename, contentType } = {}) {
  const r = await fetch(url, {
    method: "GET",
    headers: {
      Accept: contentType || "application/octet-stream",
    },
  });

  if (!r.ok) {
    res.status(r.status).send(`Upstream error: ${r.status}`);
    return;
  }

  const ct = contentType || r.headers.get("content-type") || "application/octet-stream";
  res.setHeader("Content-Type", ct);

  const name = safeFilename(filename, "file");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${name}"`);

  // ปรับ cache ให้เสถียรขึ้น
  res.setHeader("Cache-Control", "public, max-age=3600");

  // ส่งผ่าน stream
  const buf = Buffer.from(await r.arrayBuffer());
  res.end(buf);
}

router.get("/video/:fileId", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT file_path, file_type, original_name FROM document_files WHERE document_file_id = $1",
      [req.params.fileId]
    );
    if (!rows.length) return res.status(404).send("ไม่พบไฟล์วิดีโอ");

    const file = rows[0];
    if (!file.file_type?.startsWith("video/")) return res.status(404).send("ไฟล์นี้ไม่ใช่วิดีโอ");

    // ✅ ถ้าเป็น URL ให้ proxy กลับมา (กัน CORS/redirect issues)
    if (isHttpUrl(file.file_path)) {
      return await proxyUrlToResponse(file.file_path, res, {
        inline: true,
        filename: file.original_name || "video.mp4",
        contentType: file.file_type || "video/mp4",
      });
    }

    const fullPath = resolveLocalPath(file.file_path);
    if (!fullPath) return res.status(404).send("ไม่พบไฟล์วิดีโอบนเซิร์ฟเวอร์");

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = file.file_type || mime.lookup(fullPath) || "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
        return res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
      }

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": contentType,
      });
      return fs.createReadStream(fullPath, { start, end }).pipe(res);
    }

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาดในการดึงไฟล์วิดีโอ");
  }
});

router.get("/view/:fileId", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT file_path, file_type, original_name FROM document_files WHERE document_file_id = $1",
      [req.params.fileId]
    );
    if (!rows.length) return res.status(404).json({ error: "ไม่พบไฟล์" });

    const file = rows[0];

    // ✅ สำคัญ: ห้าม redirect ถ้าอยากให้ react-pdf เสถียร
    if (isHttpUrl(file.file_path)) {
      return await proxyUrlToResponse(file.file_path, res, {
        inline: true,
        filename: file.original_name || "file.pdf",
        contentType: file.file_type || "application/pdf",
      });
    }

    const fullPath = resolveLocalPath(file.file_path);
    if (!fullPath) return res.status(404).json({ error: "ไม่พบไฟล์บนเซิร์ฟเวอร์" });

    const contentType = file.file_type || mime.lookup(fullPath) || "application/pdf";
    res.setHeader("Content-Type", contentType);

    const name = safeFilename(file.original_name, path.basename(fullPath));
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    res.setHeader("Cache-Control", "public, max-age=3600");

    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงไฟล์" });
  }
});

router.get("/download/:fileId", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT document_id, file_path, file_type, original_name FROM document_files WHERE document_file_id = $1",
      [req.params.fileId]
    );
    if (!rows.length) return res.status(404).send("ไม่พบไฟล์");

    const file = rows[0];

    if (shouldCountDownloadOnce(req.params.fileId, req.ip)) {
      if (file.document_id) {
        await db.query(
          "UPDATE documents SET download_count = COALESCE(download_count, 0) + 1 WHERE document_id = $1",
          [file.document_id]
        );
      }
      await db.query(
        "UPDATE document_files SET download_count = COALESCE(download_count, 0) + 1 WHERE document_file_id = $1",
        [req.params.fileId]
      );
    }

    // ✅ ดาวน์โหลด: ถ้าเป็น URL ก็ proxy (ไม่ redirect) เพื่อกันปัญหา auth/cors
    if (isHttpUrl(file.file_path)) {
      return await proxyUrlToResponse(file.file_path, res, {
        inline: false,
        filename: file.original_name || "file",
        contentType: file.file_type || "application/octet-stream",
      });
    }

    const fullPath = resolveLocalPath(file.file_path);
    if (!fullPath) return res.status(404).send("ไม่พบไฟล์บนเซิร์ฟเวอร์");

    return res.download(fullPath, file.original_name || path.basename(fullPath) || "file");
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
  }
});

module.exports = router;