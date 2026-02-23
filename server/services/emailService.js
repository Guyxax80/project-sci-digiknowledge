// server/services/emailService.js
const nodemailer = require("nodemailer");

let Resend = null;
function getResendClient() {
  if (!Resend) {
    // lazy require กันพังถ้ายังไม่ได้ติดตั้ง
    // eslint-disable-next-line global-require
    Resend = require("resend").Resend;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || "smtp").toLowerCase();
// smtp | resend

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

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
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    // ✅ timeout กัน ETIMEDOUT
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,

    requireTLS: true,
    tls: { servername: host },
  });

  return cachedTransporter;
}

async function verifySmtpSafe() {
  if (verifiedOnce) return { ok: true, skipped: true };

  const t = getTransporter();
  try {
    await t.verify();
    verifiedOnce = true;
    console.info("[email] SMTP verify OK");
    return { ok: true };
  } catch (err) {
    console.error("[email] SMTP verify failed", {
      message: err?.message,
      code: err?.code,
      response: err?.response,
    });
    return { ok: false, error: err?.message, code: err?.code };
  }
}

/**
 * sendEmail
 * - ไม่ทำให้ระบบพัง: ส่งไม่สำเร็จ -> skipped:true
 */
async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    console.warn('[email] Missing "to". Skip sending email.');
    return { skipped: true };
  }

  // ======================
  // ✅ RESEND (แนะนำ)
  // ======================
  if (EMAIL_PROVIDER === "resend") {
    if (!isResendConfigured()) {
      console.warn("[email] Resend not configured. Skip.", {
        hasKey: Boolean(process.env.RESEND_API_KEY),
        hasFrom: Boolean(process.env.EMAIL_FROM),
      });
      return { skipped: true };
    }

    try {
      const resend = getResendClient();

      const resp = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to,
        subject: subject || "(no subject)",
        text: text || undefined,
        html: html || undefined,
      });

      console.info("[email] sent via Resend", { to, id: resp?.data?.id, error: resp?.error });
      if (resp?.error) return { skipped: true, error: resp.error?.message || "resend error" };

      return { skipped: false, messageId: resp?.data?.id };
    } catch (err) {
      console.error("[email] Resend send failed (ignored)", {
        message: err?.message,
      });
      return { skipped: true, error: err?.message };
    }
  }

  // ======================
  // ✅ SMTP (เดิม)
  // ======================
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

  const transporter = getTransporter();

  // verify ครั้งแรก เพื่อ log ชัด
  await verifySmtpSafe();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: subject || "(no subject)",
      text: text || undefined,
      html: html || undefined,
    });

    console.info("[email] sent via SMTP", { to, messageId: info?.messageId, response: info?.response });
    return { skipped: false, messageId: info?.messageId };
  } catch (err) {
    console.error("[email] send failed (ignored)", {
      message: err?.message,
      code: err?.code,
      response: err?.response,
    });
    return { skipped: true, error: err?.message, code: err?.code };
  }
}

module.exports = { sendEmail, isSmtpConfigured, verifySmtpSafe };