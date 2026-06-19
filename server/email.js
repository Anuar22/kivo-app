const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// ─── SENDER SETUP ─────────────────────────────────────────────────────────
//
// Two ways to send mail, checked in this order:
//   1. SMTP (your own domain mail, e.g. DirectAdmin/cPanel/Zoho). Accepts
//      either naming style in server/.env — use whichever you already have:
//        SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
//        MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD / MAIL_SCHEME
//   2. Resend — set RESEND_API_KEY (and verify a domain there so it's not
//      limited to onboarding@resend.dev, which can only email your own
//      Resend account address).
// If neither is configured, codes are just logged to the console so local
// dev still works without sending real email.

const MAIL_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST;
const MAIL_PORT = Number(process.env.SMTP_PORT || process.env.MAIL_PORT) || 587;
const MAIL_USER = process.env.SMTP_USER || process.env.MAIL_USERNAME;
const MAIL_PASS = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
// "smtps" (Laravel's MAIL_SCHEME) or port 465 both mean implicit TLS on connect
const MAIL_SECURE = process.env.MAIL_SCHEME === "smtps" || MAIL_PORT === 465;

const smtpConfigured = !!(MAIL_HOST && MAIL_USER && MAIL_PASS);

const smtpTransport = smtpConfigured
  ? nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: MAIL_SECURE,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    })
  : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resolve the "From" name + address from either naming style. Laravel's
// `.env` often has MAIL_FROM_NAME="${APP_NAME}" as a literal string (Laravel
// expands that itself at runtime) — Node's dotenv does NOT expand it, so we
// resolve it manually against APP_NAME, falling back to "Kivo".
function resolveFrom() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;

  const address = process.env.MAIL_FROM_ADDRESS || MAIL_USER || "no-reply@example.com";
  let name = process.env.MAIL_FROM_NAME || "Kivo";
  if (name.includes("${APP_NAME}")) {
    name = name.replace("${APP_NAME}", process.env.APP_NAME || "Kivo");
  }
  return `${name} <${address.replace(/^"|"$/g, "")}>`;
}

const FROM = resolveFrom() || process.env.RESEND_FROM_EMAIL || "Kivo <onboarding@resend.dev>";

// Generates a 6-digit numeric code as a string, e.g. "042913"
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildHtml({ heading, body, code }) {
  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <h1 style="font-family: Georgia, serif; font-weight: 800; font-size: 28px; color: #0f0f0f; margin: 0 0 4px;">Kivo</h1>
      <p style="color: #999; font-size: 13px; margin: 0 0 28px;">${heading}</p>
      <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">${body}</p>
      <div style="background: #fdecea; border: 1.5px solid #ffe8da; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: Georgia, serif; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #e53935;">${code}</span>
      </div>
      <p style="color: #aaa; font-size: 12px; line-height: 1.5;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

function buildText({ heading, body, code }) {
  return `${heading}\n\n${body}\n\nYour code: ${code}\n\nIf you didn't request this, you can safely ignore this email.\n\n— Kivo`;
}

async function sendOtpEmail(toEmail, code, purpose = "verify_email") {
  const subject = purpose === "reset_password"
    ? "Your Kivo password reset code"
    : "Verify your Kivo account";

  const heading = purpose === "reset_password"
    ? "Reset your password"
    : "Welcome to Kivo!";

  const body = purpose === "reset_password"
    ? "Use the code below to reset your password. It expires in 10 minutes."
    : "Use the code below to verify your email address. It expires in 10 minutes.";

  const html = buildHtml({ heading, body, code });
  const text = buildText({ heading, body, code });

  // ── Option 1: your own domain SMTP (e.g. DirectAdmin) ────────────────────
  if (smtpTransport) {
    try {
      const info = await smtpTransport.sendMail({
        from: FROM,
        to: toEmail,
        replyTo: FROM,
        subject,
        text,
        html,
      });
      console.log(
        `[SMTP] messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} response="${info.response}"`
      );
      return { sent: true, via: "smtp" };
    } catch (err) {
      console.error("SMTP send error:", err.message);
      return { sent: false, reason: err.message, via: "smtp" };
    }
  }

  // ── Option 2: Resend ──────────────────────────────────────────────────
  if (resend) {
    try {
      await resend.emails.send({ from: FROM, to: toEmail, subject, html, text });
      return { sent: true, via: "resend" };
    } catch (err) {
      console.error("Resend send error:", err.message);
      return { sent: false, reason: err.message, via: "resend" };
    }
  }

  // ── Option 3: nothing configured — log instead so local dev still works ──
  console.log(`[OTP] (no email sender configured) Code for ${toEmail}: ${code}`);
  return { sent: false, reason: "no_email_sender_configured" };
}

module.exports = { generateCode, sendOtpEmail };
