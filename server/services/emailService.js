const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM;
  const smtp = getTransporter();

  if (!smtp || !from || !to) {
    console.warn('[email] SMTP not configured or recipient missing; skip send', { hasSmtp: !!smtp, hasFrom: !!from, hasTo: !!to });
    return { delivered: false };
  }

  await smtp.sendMail({ from, to, subject, text, html });
  return { delivered: true };
}

module.exports = { sendEmail };