const { Resend } = require("resend");

// ─── RESEND SETUP ──────────────────────────────────────────────────────────
//
// Set these two env vars on Render (and nowhere else — no SMTP/MAIL_* vars):
//   RESEND_API_KEY      → your Resend API key (starts with re_)
//   RESEND_FROM_EMAIL   → e.g. "Kivo <noreply@ajiralink.co.tz>"
//                         must match your verified Resend domain exactly
//
// If RESEND_API_KEY is absent (local dev without Resend), the OTP code is
// just printed to the console so development still works without real email.

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Kivo <onboarding@resend.dev>";

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
  const subject =
    purpose === "reset_password"
      ? "Your Kivo password reset code"
      : "Verify your Kivo account";

  const heading =
    purpose === "reset_password"
      ? "Reset your password"
      : "Welcome to Kivo!";

  const body =
    purpose === "reset_password"
      ? "Use the code below to reset your password. It expires in 10 minutes."
      : "Use the code below to verify your email address. It expires in 10 minutes.";

  const html = buildHtml({ heading, body, code });
  const text = buildText({ heading, body, code });

  // ── Resend ────────────────────────────────────────────────────────────────
  if (resend) {
    try {
      console.log(`[Resend] Sending → to=${toEmail} from=${FROM} purpose=${purpose}`);
      const result = await resend.emails.send({
        from: FROM,
        to: toEmail,
        subject,
        html,
        text,
      });
      console.log(`[Resend] Success:`, JSON.stringify(result));
      return { sent: true, via: "resend" };
    } catch (err) {
      console.error(`[Resend] Send error:`, err.message, JSON.stringify(err));
      return { sent: false, reason: err.message, via: "resend" };
    }
  }

  // ── No sender configured — log code to console (local dev fallback) ───────
  console.log(`[OTP] (no RESEND_API_KEY set) Code for ${toEmail}: ${code}`);
  return { sent: false, reason: "no_email_sender_configured" };
}

module.exports = { generateCode, sendOtpEmail };
