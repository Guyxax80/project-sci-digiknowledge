// server/services/emailService.js
const nodemailer = require("nodemailer");

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

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);

  // ✅ 465 = SSL, 587 = STARTTLS
  const secure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    // ✅ timeout กันค้างนาน
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,

    // ✅ ถ้า 587 ให้บังคับ STARTTLS
    ...(secure ? {} : { requireTLS: true }),

    tls: {
      servername: host,
    },
  });

  return cachedTransporter;
}

/**
 * ✅ ไม่ verify แล้ว (เพราะ verify ชอบ timeout บน host ที่บล็อก)
 * ถ้าจะ debug ค่อยเรียกเองตอน dev
 */
async function sendEmail({ to, subject, text, html }) {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured. Skip sending email.", {
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
      subject: subject || "(no subject)",
      text: text || undefined,
      html: html || undefined,
    });

    console.info("[email] sent via SMTP", {
      to,
      messageId: info?.messageId,
      response: info?.response,
    });

    return { skipped: false, messageId: info?.messageId };
  } catch (err) {
    console.error("[email] send failed (ignored)", {
      to,
      subject,
      message: err?.message,
      code: err?.code,
      response: err?.response,
    });
    return { skipped: true, error: err?.message, code: err?.code };
  }
}

module.exports = { sendEmail, isSmtpConfigured };