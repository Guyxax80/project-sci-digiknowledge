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
let verifiedOnce = false;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // ✅ 587 ใช้ STARTTLS (secure=false)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    // ✅ ป้องกัน timeout / ช่วย debug ETIMEDOUT
    connectionTimeout: 20000, // 20s
    greetingTimeout: 20000,
    socketTimeout: 30000, // 30s

    // ✅ บังคับใช้ TLS บน 587 (บาง host ต้องการ)
    requireTLS: true,

    tls: {
      servername: host, // ✅ ช่วย TLS handshake
      // rejectUnauthorized: true, // ค่า default (ปลอดภัย)
    },
  });

  return cachedTransporter;
}

/**
 * verifySmtpSafe
 * - ลอง verify 1 ครั้ง (ไม่ทำให้ระบบพัง)
 */
async function verifySmtpSafe() {
  if (verifiedOnce) return { ok: true, skipped: true };

  const transporter = getTransporter();
  try {
    await transporter.verify();
    verifiedOnce = true;
    console.info("[email] SMTP verify OK");
    return { ok: true };
  } catch (err) {
    console.error("[email] SMTP verify failed", {
      message: err?.message,
      code: err?.code,
      response: err?.response,
    });
    // ไม่ throw เพื่อไม่ให้ระบบล้ม
    return { ok: false, error: err?.message, code: err?.code };
  }
}

/**
 * sendEmail
 * - ENV ไม่ครบ -> ไม่ throw, แค่ warn แล้ว return { skipped: true }
 * - ส่งสำเร็จ -> return { skipped:false, messageId }
 * - ส่งไม่สำเร็จ -> log แล้ว return { skipped:true }
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

  // ✅ verify ก่อน (ครั้งแรกเท่านั้น) เพื่อเห็นปัญหาชัด ๆ
  await verifySmtpSafe();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM, // เช่น "SCI DigiKnowledge <wanrada396@gmail.com>"
      to,
      subject: subject || "(no subject)",
      text: text || undefined,
      html: html || undefined,
    });

    console.info("[email] sent", {
      to,
      messageId: info?.messageId,
      response: info?.response,
    });

    return { skipped: false, messageId: info.messageId };
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

module.exports = { sendEmail, isSmtpConfigured, verifySmtpSafe };