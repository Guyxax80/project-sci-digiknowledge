// server/services/emailService.js
const nodemailer = require("nodemailer");

let ResendCtor = null;
let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;

  if (!ResendCtor) {
    // lazy require กันพังถ้ายังไม่ได้ติดตั้ง
    // eslint-disable-next-line global-require
    ResendCtor = require("resend").Resend;
  }

  resendClient = new ResendCtor(process.env.RESEND_API_KEY);
  return resendClient;
}

// ✅ แนะนำให้ default เป็น resend เพราะ Render free ส่ง SMTP ไม่ได้
const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || "resend").toLowerCase();
// "smtp" | "resend"

function normalizeRecipients(to) {
  if (!to) return [];
  if (Array.isArray(to)) return to.map(String).map((s) => s.trim()).filter(Boolean);
  return String(to).split(",").map((s) => s.trim()).filter(Boolean);
}

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

  // 465 -> secure true (SSL)
  // 587 -> secure false (STARTTLS)
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

    // STARTTLS บน 587
    requireTLS: !secure,

    // TLS settings (ปลอดภัยและไม่ทำให้พัง)
    tls: {
      servername: host,
    },
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
 * @param {object} params
 * @param {string|string[]} params.to
 * @param {string} params.subject
 * @param {string} params.text
 * @param {string} params.html
 */
async function sendEmail({ to, subject, text, html }) {
  const recipients = normalizeRecipients(to);

  if (recipients.length === 0) {
    console.warn('[email] Missing "to". Skip sending email.');
    return { skipped: true };
  }

  const from = String(process.env.EMAIL_FROM || "").trim();
  const safeSubject = subject || "(no subject)";

  // ======================
  // ✅ RESEND
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
        from,
        to: recipients,
        subject: safeSubject,
        text: text || undefined,
        html: html || undefined,
      });

      // Resend v2 คืนเป็น { data, error }
      const id = resp?.data?.id;
      const err = resp?.error;

      if (err) {
        console.error("[email] Resend send failed (ignored)", {
          to: recipients,
          message: err?.message || "resend error",
        });
        return { skipped: true, error: err?.message || "resend error" };
      }

      console.info("[email] sent via Resend", { to: recipients, id });
      return { skipped: false, messageId: id };
    } catch (err) {
      console.error("[email] Resend send failed (ignored)", {
        to: recipients,
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
      from,
      to: recipients.join(", "),
      subject: safeSubject,
      text: text || undefined,
      html: html || undefined,
    });

    console.info("[email] sent via SMTP", {
      to: recipients,
      messageId: info?.messageId,
      response: info?.response,
    });
    return { skipped: false, messageId: info?.messageId };
  } catch (err) {
    console.error("[email] send failed (ignored)", {
      to: recipients,
      message: err?.message,
      code: err?.code,
      response: err?.response,
    });
    return { skipped: true, error: err?.message, code: err?.code };
  }
}

module.exports = {
  sendEmail,
  isSmtpConfigured,
  verifySmtpSafe,
};