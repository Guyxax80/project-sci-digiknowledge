const db = require('../db');
const { sendEmail } = require('./emailService');

let hasEmailColumn;

async function usersHasEmailColumn() {
  if (typeof hasEmailColumn === 'boolean') return hasEmailColumn;
  const { rows } = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='users' AND column_name='email' LIMIT 1`
  );
  hasEmailColumn = rows.length > 0;
  return hasEmailColumn;
}

async function getUserContact(userId) {
  const withEmail = await usersHasEmailColumn();
  const sql = withEmail
    ? `SELECT user_id, username, NULLIF(email, '') AS email FROM public.users WHERE user_id = $1 LIMIT 1`
    : `SELECT user_id, username, NULL::text AS email FROM public.users WHERE user_id = $1 LIMIT 1`;

  const { rows } = await db.query(sql, [userId]);
  if (!rows.length) return null;
  const user = rows[0];
  const fallbackEmail = String(user.username || '').includes('@') ? user.username : null;
  return { ...user, email: user.email || fallbackEmail };
}

async function createNotification({ userId, documentId, subject, message, delivered }) {
  await db.query(
    `INSERT INTO public.notifications (user_id, document_id, channel, subject, message, sent_at, is_sent)
     VALUES ($1, $2, 'email', $3, $4, NOW(), $5)`,
    [userId, documentId, subject, message, !!delivered]
  );
}

async function notifyByEmail({ userId, documentId, subject, message, html }) {
  const user = await getUserContact(userId);
  const to = user?.email || null;

  let delivered = false;
  try {
    const result = await sendEmail({ to, subject, text: message, html });
    delivered = !!result?.delivered;
  } catch (err) {
    console.warn('[email] send failed', err.message);
  }

  await createNotification({ userId, documentId, subject, message, delivered });
}

module.exports = { notifyByEmail };