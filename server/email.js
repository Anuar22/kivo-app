const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL || "Kivo <onboarding@resend.dev>";

// Generates a 6-digit numeric code as a string, e.g. "042913"
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(toEmail, code, purpose = "verify_email") {
  if (!resend) {
    // No key configured — log instead of sending, so local dev still works.
    console.log(`[OTP] (Resend not configured) Code for ${toEmail}: ${code}`);
    return { sent: false, reason: "no_api_key" };
  }

  const subject = purpose === "reset_password"
    ? "Your Kivo password reset code"
    : "Verify your Kivo account";

  const heading = purpose === "reset_password"
    ? "Reset your password"
    : "Welcome to Kivo!";

  const body = purpose === "reset_password"
    ? "Use the code below to reset your password. It expires in 10 minutes."
    : "Use the code below to verify your email address. It expires in 10 minutes.";

  try {
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <h1 style="font-family: Georgia, serif; font-weight: 800; font-size: 28px; color: #0f0f0f; margin: 0 0 4px;">Kivo</h1>
          <p style="color: #999; font-size: 13px; margin: 0 0 28px;">${heading}</p>
          <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">${body}</p>
          <div style="background: #fdecea; border: 1.5px solid #ffe8da; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: Georgia, serif; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #e53935;">${code}</span>
          </div>
          <p style="color: #aaa; font-size: 12px; line-height: 1.5;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error("Resend send error:", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { generateCode, sendOtpEmail };
