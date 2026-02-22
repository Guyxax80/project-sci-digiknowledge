// server/services/emailService.js
const nodemailer = require('nodemailer');

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM
  );
}

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // Gmail SMTP (ใช้ App Password)
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // 587 = STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
}

/**
 * sendEmail
 * - ถ้า ENV ไม่ครบ -> ไม่ throw, แค่ warn แล้ว return { skipped: true }
 * - ถ้าส่งสำเร็จ -> return { skipped:false, messageId }
 */
async function sendEmail({ to, subject, text, html }) {
  if (!isSmtpConfigured()) {
    console.warn('[email] SMTP not configured. Skip sending email.', {
      hasHost: Boolean(process.env.SMTP_HOST),
      hasPort: Boolean(process.env.SMTP_PORT),
      hasUser: Boolean(process.env.SMTP_USER),
      hasPass: Boolean(process.env.SMTP_PASS),
      hasFrom: Boolean(process.env.EMAIL_FROM),
    });
    return { skipped: true };
  }

  if (!to) {
    console.warn('[email] Missing "to". Skip sending email.');
    return { skipped: true };
  }

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: subject || '(no subject)',
      text: text || undefined,
      html: html || undefined,
    });

    console.info('[email] sent', { to, messageId: info.messageId });
    return { skipped: false, messageId: info.messageId };
  } catch (err) {
    // ตาม requirement: ห้ามทำให้ระบบพัง
    console.error('[email] send failed (ignored)', {
      message: err.message,
      code: err.code,
      response: err.response,
    });
    return { skipped: true, error: err.message };
  }
}

module.exports = { sendEmail, isSmtpConfigured };