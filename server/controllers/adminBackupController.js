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

/**
 * IMPORTANT:
 * - Node/pg may accept extra query params (e.g. uselibpqcompat) but pg_dump/psql (libpq) will FAIL.
 * - For CLI tools we sanitize the URL:
 *   - remove uselibpqcompat
 *   - ensure sslmode=require (recommended for Supabase)
 */
function dbUrlForCli() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Missing DATABASE_URL");

  let u;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }

  u.searchParams.delete("uselibpqcompat");

  if (!u.searchParams.get("sslmode")) {
    u.searchParams.set("sslmode", "require");
  }

  return u.toString();
}

const TMP_DIR = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function safeUnlink(p) {
  if (!p) return;
  fs.unlink(p, () => {});
}

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (ปรับได้)
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
// GET /admin/backup/tables  -> list tables (public only)
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
// ✅ backup เฉพาะ public schema (ไม่เอา auth/storage)
// =========================
async function backup(req, res) {
  if (!mustEnabled(res)) return;

  const { scope = "all", tables = [], destination = "download" } = req.body || {};
  const dbUrl = dbUrlForCli();

  const normalizedScope = String(scope).toLowerCase();
  const normalizedDest = String(destination).toLowerCase();

  const wantedTables = Array.isArray(tables) ? tables.map((t) => String(t).trim()).filter(Boolean) : [];
  if (normalizedScope === "tables" && wantedTables.length === 0) {
    return res.status(400).json({ error: "เลือกตารางอย่างน้อย 1 ตาราง" });
  }

  // ✅ default: dump ทั้ง public schema
  const args = ["--no-owner", "--no-privileges", "--format=plain"];

// ===== scope: all (schema + data) =====
if (normalizedScope === "all") {
  // dump เฉพาะ public schema (ทั้ง schema+data)
  // ✅ ใส่ clean เพื่อให้ restore ง่าย ไม่ชน "already exists"
  args.push("--clean", "--if-exists");
  args.push("--schema=public");
}

// ===== scope: tables (data-only) =====
if (normalizedScope === "tables") {
  // ✅ data-only: ไม่มี CREATE TABLE / CREATE TYPE
  args.push("--data-only", "--column-inserts"); // หรือใช้ "--inserts" ก็ได้

  // ระบุรายตาราง
  wantedTables.forEach((t) => args.push("--table", `public.${t}`));
}

// ใส่ dbUrl ไว้ท้ายสุด (ชัดเจน)
args.push(`--dbname=${dbUrl}`);

  const stamp = nowStamp();
  const filename =
    normalizedScope === "all"
      ? `backup-public-${stamp}.sql`
      : `backup-${wantedTables.join("_")}-${stamp}.sql`;

  // 1) DOWNLOAD: stream directly
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

  // 2) SERVER / SUPABASE: write to file first
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
        return res.json({
          ok: true,
          destination: "server",
          filename,
          localPath: outPath,
          note: "Filesystem may be ephemeral. Prefer Supabase Storage.",
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
          signedUrl: up.signedUrl,
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
// JSON: { source:"supabase", path:"backups/xxx.sql", mode:"overwrite_public"|"overwrite_tables", tables:["users"] }
// หรือ multipart: file=@backup.sql + mode/tables ใน body
// =========================
async function restore(req, res) {
  if (!mustEnabled(res)) return;

  const dbUrl = dbUrlForCli();
  const ct = String(req.headers["content-type"] || "");

  // -------- JSON restore from Supabase storage --------
  if (ct.includes("application/json")) {
    const { source, path: sbPath, mode = "overwrite_public", tables = [] } = req.body || {};

    if (String(source).toLowerCase() !== "supabase" || !sbPath) {
      return res.status(400).json({ error: "ต้องส่ง { source:'supabase', path:'backups/..sql' }" });
    }

    const sb = supabaseClient();
    if (!sb) return res.status(500).json({ error: "Missing Supabase env" });

    const bucket = process.env.SUPABASE_BACKUP_BUCKET || "db-backups";
    const { data, error } = await sb.storage.from(bucket).download(sbPath);
    if (error) return res.status(400).json({ error: error.message });

    const arrayBuffer = await data.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    const tmpFile = path.join(TMP_DIR, `restore-${nowStamp()}.sql`);
    fs.writeFileSync(tmpFile, buf);

    return runRestoreFromFile({ filePath: tmpFile, dbUrl, res, mode, tables });
  }

  return res.status(400).json({ error: "ต้องส่งแบบ multipart/form-data (file) หรือ JSON (source=supabase)" });
}

// middleware สำหรับ multipart restore
const restoreUploadMiddleware = upload.single("file");

// multipart handler wrapper
function restoreFromUpload(req, res) {
  if (!mustEnabled(res)) return;

  const dbUrl = dbUrlForCli();
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Missing file" });

  const mode = String(req.body?.mode || "overwrite_public");
  const tables = req.body?.tables || [];

  return runRestoreFromFile({ filePath: file.path, dbUrl, res, mode, tables });
}

// ---------------------
// Restore helpers
// ---------------------
function quoteIdent(name) {
  // allow only safe identifiers (กัน SQL injection)
  if (!/^[a-zA-Z0-9_]+$/.test(String(name))) return null;
  return `"${name}"`;
}

function runPsqlSql({ dbUrl, sql, cb }) {
  const child = spawn("psql", [`--dbname=${dbUrl}`, "-v", "ON_ERROR_STOP=1"], {
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let errText = "";
  child.stderr.on("data", (d) => (errText += d.toString()));

  child.stdin.write(sql);
  child.stdin.end();

  child.on("close", (code) => cb(code, errText));
}

function importSqlFile({ filePath, dbUrl, res, mode, tables }) {
  const child = spawn("psql", [`--dbname=${dbUrl}`, "-v", "ON_ERROR_STOP=1"], {
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  fs.createReadStream(filePath).pipe(child.stdin);

  let errText = "";
  child.stderr.on("data", (d) => (errText += d.toString()));

  child.on("close", (code) => {
    safeUnlink(filePath);

    if (code !== 0) {
      console.error("psql restore failed:", errText);
      return res.status(500).json({ error: "Restore failed", detail: errText.slice(0, 1600) });
    }

    return res.json({ ok: true, mode, tables: tables || null });
  });
}

function runRestoreFromFile({ filePath, dbUrl, res, mode = "overwrite_public", tables = [] }) {
  const normalizedMode = String(mode).toLowerCase();

  // ✅ 1) ทับทั้งระบบ public
  if (normalizedMode === "overwrite_public") {
    const sql = `
DO $$
BEGIN
  EXECUTE 'DROP SCHEMA IF EXISTS public CASCADE';
  EXECUTE 'CREATE SCHEMA public';
  EXECUTE 'GRANT ALL ON SCHEMA public TO postgres';
  EXECUTE 'GRANT ALL ON SCHEMA public TO public';
END $$;
`;
    return runPsqlSql({
      dbUrl,
      sql,
      cb: (code, errText) => {
        if (code !== 0) {
          safeUnlink(filePath);
          return res.status(500).json({ error: "Clean public schema failed", detail: errText.slice(0, 1600) });
        }
        return importSqlFile({ filePath, dbUrl, res, mode: "overwrite_public" });
      },
    });
  }

  // ✅ 2) ทับเฉพาะบางตาราง (เช่น users)
  if (normalizedMode === "overwrite_tables") {
    const list = Array.isArray(tables)
      ? tables.map((t) => String(t).trim()).filter(Boolean)
      : String(tables || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    if (list.length === 0) {
      safeUnlink(filePath);
      return res.status(400).json({ error: "ต้องระบุ tables อย่างน้อย 1 ตาราง (mode=overwrite_tables)" });
    }

    const quoted = [];
    for (const t of list) {
      const qi = quoteIdent(t);
      if (!qi) {
        safeUnlink(filePath);
        return res.status(400).json({ error: `Invalid table name: ${t}` });
      }
      quoted.push(`public.${qi}`);
    }

    const sql = `TRUNCATE TABLE public."student_codes" RESTART IDENTITY;`;

    return runPsqlSql({
      dbUrl,
      sql,
      cb: (code, errText) => {
        if (code !== 0) {
          safeUnlink(filePath);
          return res.status(500).json({ error: "Truncate tables failed", detail: errText.slice(0, 1600) });
        }
        return importSqlFile({ filePath, dbUrl, res, mode: "overwrite_tables", tables: list });
      },
    });
  }

  safeUnlink(filePath);
  return res.status(400).json({ error: "mode ไม่ถูกต้อง (ใช้ overwrite_public หรือ overwrite_tables)" });
}

module.exports = {
  listTables,
  backup,
  restore,
  restoreUploadMiddleware,
  restoreFromUpload,
};