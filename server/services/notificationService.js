const db = require("../db");
const { sendEmail } = require("./emailService");

let hasEmailColumn;
let notificationsHasSubject;
let notificationsHasIsSent;

async function usersHasEmailColumn() {
  if (typeof hasEmailColumn === "boolean") return hasEmailColumn;
  const { rows } = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='users' AND column_name='email' LIMIT 1`
  );
  hasEmailColumn = rows.length > 0;
  return hasEmailColumn;
}

async function notificationsHasColumn(columnName) {
  if (columnName === "subject" && typeof notificationsHasSubject === "boolean") return notificationsHasSubject;
  if (columnName === "is_sent" && typeof notificationsHasIsSent === "boolean") return notificationsHasIsSent;

  const { rows } = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='notifications' AND column_name=$1 LIMIT 1`,
    [columnName]
  );

  const ok = rows.length > 0;
  if (columnName === "subject") notificationsHasSubject = ok;
  if (columnName === "is_sent") notificationsHasIsSent = ok;
  return ok;
}

async function getUserContact(userId) {
  const withEmail = await usersHasEmailColumn();
  const sql = withEmail
    ? `SELECT user_id, username, NULLIF(email, '') AS email FROM public.users WHERE user_id = $1 LIMIT 1`
    : `SELECT user_id, username, NULL::text AS email FROM public.users WHERE user_id = $1 LIMIT 1`;

  const { rows } = await db.query(sql, [userId]);
  if (!rows.length) return null;

  const user = rows[0];
  const fallbackEmail = String(user.username || "").includes("@") ? user.username : null;
  return { ...user, email: user.email || fallbackEmail };
}

async function createNotification({ userId, documentId, subject, message, delivered }) {
  const hasSubject = await notificationsHasColumn("subject");
  const hasIsSent = await notificationsHasColumn("is_sent");

  // สร้างชุด column/value แบบไดนามิก ให้ตรง schema จริง
  const cols = ["user_id", "document_id", "channel", "message", "sent_at"];
  const vals = ["$1", "$2", "'email'", "$3", "NOW()"];
  const params = [userId, documentId ?? null, message];

  let idx = params.length + 1;

  if (hasSubject) {
    cols.splice(3, 0, "subject"); // แทรกก่อน message
    vals.splice(3, 0, `$${idx}`);
    params.push(subject || "");
    idx++;
  }

  if (hasIsSent) {
    cols.push("is_sent");
    vals.push(`$${idx}`);
    params.push(!!delivered);
    idx++;
  }

  const sql = `INSERT INTO public.notifications (${cols.join(", ")}) VALUES (${vals.join(", ")})`;
  await db.query(sql, params);
}

async function notifyByEmail({ userId, documentId, subject, message, html }) {
  const user = await getUserContact(userId);
  const to = user?.email || null;

  let delivered = false;
  try {
    const result = await sendEmail({ to, subject, text: message, html });
    delivered = !!result?.delivered;
  } catch (err) {
    console.warn("[email] send failed", err.message);
  }

  await createNotification({ userId, documentId, subject, message, delivered });
}

module.exports = { notifyByEmail };