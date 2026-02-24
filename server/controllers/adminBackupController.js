const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

function enabled() {
  return String(process.env.ADMIN_DB_TOOLS_ENABLED || "").toLowerCase() === "true";
}

function mustEnabled(res) {
  if (!enabled()) {
    res.status(501).json({ error: "Admin DB tools not enabled. Set ADMIN_DB_TOOLS_ENABLED=true" });
    return false;
  }
  return true;
}

function getDbUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return url;
}

const TMP_DIR = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function safeUnlink(p) {
  if (!p) return;
  fs.unlink(p, () => {});
}

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 80 * 1024 * 1024 }, // 80MB (ปรับได้)
  fileFilter: (_req, file, cb) => {
    const ok = String(file.originalname || "").toLowerCase().endsWith(".sql");
    if (!ok) return cb(new Error("Only .sql files are allowed"));
    cb(null, true);
  },
});

function supabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function uploadToSupabase({ localFilePath, destPath }) {
  const sb = supabaseClient();
  if (!sb) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const bucket = process.env.SUPABASE_BACKUP_BUCKET || "db-backups";
  const fileBuffer = fs.readFileSync(localFilePath);

  const { error: upErr } = await sb.storage.from(bucket).upload(destPath, fileBuffer, {
    contentType: "application/sql",
    upsert: true,
  });
  if (upErr) throw new Error(upErr.message);

  // สร้าง signed URL (1 ชั่วโมง)
  const { data, error: signErr } = await sb.storage.from(bucket).createSignedUrl(destPath, 60 * 60);
  if (signErr) throw new Error(signErr.message);

  return { bucket, path: destPath, signedUrl: data?.signedUrl || null };
}

function nowStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

// =========================
// GET /admin/backup/tables  -> list tables
// =========================
async function listTables(req, res) {
  try {
    const { rows } = await req.app.locals.db.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
        AND table_type='BASE TABLE'
      ORDER BY table_name ASC
      `
    );
    return res.json(rows.map((r) => r.table_name));
  } catch (e) {
    console.error("listTables error:", e);
    return res.status(500).json({ error: "Cannot list tables" });
  }
}

// =========================
// POST /admin/backup
// body: { scope: "all"|"tables", tables: ["users"], destination: "download"|"server"|"supabase" }
// =========================
async function backup(req, res) {
  if (!mustEnabled(res)) return;

  const { scope = "all", tables = [], destination = "download" } = req.body || {};
  const dbUrl = getDbUrl();

  const normalizedScope = String(scope).toLowerCase();
  const normalizedDest = String(destination).toLowerCase();

  // ตรวจ tables
  const wantedTables = Array.isArray(tables) ? tables.map((t) => String(t).trim()).filter(Boolean) : [];
  if (normalizedScope === "tables" && wantedTables.length === 0) {
    return res.status(400).json({ error: "เลือกตารางอย่างน้อย 1 ตาราง" });
  }

  // สร้าง args ของ pg_dump
  const args = [
    "--no-owner",
    "--no-privileges",
    "--format=plain",
    `--dbname=${dbUrl}`,
  ];

  if (normalizedScope === "tables") {
    // ใส่ --table public.<table>
    wantedTables.forEach((t) => args.push("--table", `public.${t}`));
  }

  const stamp = nowStamp();
  const filename =
    normalizedScope === "all"
      ? `backup-all-${stamp}.sql`
      : `backup-${wantedTables.join("_")}-${stamp}.sql`;

  // 1) DOWNLOAD: stream ตรง
  if (normalizedDest === "download") {
    res.setHeader("Content-Type", "application/sql; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const child = spawn("pg_dump", args, { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.pipe(res);

    let errText = "";
    child.stderr.on("data", (d) => (errText += d.toString()));

    child.on("close", (code) => {
      if (code !== 0) console.error("pg_dump failed:", errText);
    });

    return;
  }

  // 2) SERVER / SUPABASE: ต้องเขียนลงไฟล์ก่อน
  const outPath = path.join(TMP_DIR, filename);
  const outStream = fs.createWriteStream(outPath);

  const child = spawn("pg_dump", args, { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(outStream);

  let errText = "";
  child.stderr.on("data", (d) => (errText += d.toString()));

  child.on("close", async (code) => {
    outStream.close();

    if (code !== 0) {
      safeUnlink(outPath);
      console.error("pg_dump failed:", errText);
      return res.status(500).json({ error: "Backup failed", detail: errText.slice(0, 1200) });
    }

    try {
      if (normalizedDest === "server") {
        // NOTE: Railway filesystem ไม่ถาวร (รีสตาร์ทหาย) ใช้ชั่วคราวเท่านั้น
        return res.json({
          ok: true,
          destination: "server",
          filename,
          localPath: outPath,
          note: "Railway filesystem may be ephemeral. Prefer Supabase Storage.",
        });
      }

      if (normalizedDest === "supabase") {
        const destPath = `backups/${filename}`;
        const up = await uploadToSupabase({ localFilePath: outPath, destPath });
        safeUnlink(outPath);

        return res.json({
          ok: true,
          destination: "supabase",
          filename,
          bucket: up.bucket,
          path: up.path,
          signedUrl: up.signedUrl, // ใช้โหลดภายใน 1 ชม.
        });
      }

      safeUnlink(outPath);
      return res.status(400).json({ error: "destination ไม่ถูกต้อง" });
    } catch (e) {
      safeUnlink(outPath);
      console.error("backup post-process error:", e);
      return res.status(500).json({ error: "Backup post-process failed", detail: String(e.message || e) });
    }
  });
}

// =========================
// POST /admin/restore
// 1) multipart: file=@backup.sql
// 2) json: { source: "supabase", path: "backups/xxx.sql" }
// =========================
async function restore(req, res) {
  if (!mustEnabled(res)) return;

  const dbUrl = getDbUrl();

  // ถ้าเป็น JSON restore from Supabase
  const ct = String(req.headers["content-type"] || "");
  if (ct.includes("application/json")) {
    const { source, path: sbPath } = req.body || {};
    if (String(source).toLowerCase() !== "supabase" || !sbPath) {
      return res.status(400).json({ error: "ต้องส่ง { source:'supabase', path:'backups/..sql' }" });
    }

    const sb = supabaseClient();
    if (!sb) return res.status(500).json({ error: "Missing Supabase env" });

    const bucket = process.env.SUPABASE_BACKUP_BUCKET || "db-backups";
    const { data, error } = await sb.storage.from(bucket).download(sbPath);
    if (error) return res.status(400).json({ error: error.message });

    // data เป็น Blob-like (ใน node เป็น ReadableStream บางเวอร์ชัน) -> เขียนเป็น buffer
    const arrayBuffer = await data.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    const tmpFile = path.join(TMP_DIR, `restore-${nowStamp()}.sql`);
    fs.writeFileSync(tmpFile, buf);

    return runRestoreFromFile({ filePath: tmpFile, dbUrl, res });
  }

  // ไม่ใช่ json -> ให้ไปทาง multipart (file upload)
  return res.status(400).json({ error: "ต้องส่งแบบ multipart/form-data (file) หรือ JSON (source=supabase)" });
}

// middleware สำหรับ multipart restore
const restoreUploadMiddleware = upload.single("file");

function runRestoreFromFile({ filePath, dbUrl, res }) {
  // ใช้ psql รันไฟล์
  const child = spawn("psql", [`--dbname=${dbUrl}`], { env: process.env, stdio: ["pipe", "pipe", "pipe"] });

  fs.createReadStream(filePath).pipe(child.stdin);

  let errText = "";
  child.stderr.on("data", (d) => (errText += d.toString()));

  child.on("close", (code) => {
    safeUnlink(filePath);

    if (code !== 0) {
      console.error("psql restore failed:", errText);
      return res.status(500).json({ error: "Restore failed", detail: errText.slice(0, 1600) });
    }
    return res.json({ ok: true });
  });
}

// multipart handler wrapper
function restoreFromUpload(req, res) {
  if (!mustEnabled(res)) return;

  const dbUrl = getDbUrl();
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Missing file" });

  return runRestoreFromFile({ filePath: file.path, dbUrl, res });
}

module.exports = {
  listTables,
  backup,
  restore,
  restoreUploadMiddleware,
  restoreFromUpload,
};