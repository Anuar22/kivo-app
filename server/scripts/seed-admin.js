// Creates the first (or an additional) admin account directly in the
// database — no API call, no setup token needed for this path. This is the
// simplest way to get your first admin in, especially before you've decided
// on an ADMIN_SETUP_TOKEN value or wired up curl/Postman.
//
// Edit the three values below, then run:
//   cd server
//   node scripts/seed-admin.js
//
// Safe to run more than once — it checks for an existing email first and
// won't create a duplicate.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../db");

// ── Edit these three lines with your real details ──────────────────────────
const ADMIN_NAME     = "Admin";
const ADMIN_EMAIL    = "admin@gmail.com";
const ADMIN_PASSWORD = "Admin@2026!";
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  const { rows: existing } = await pool.query(
    "SELECT id, role FROM users WHERE email=$1",
    [ADMIN_EMAIL]
  );

  if (existing.length) {
    if (existing[0].role === "admin") {
      console.log(`An admin account already exists for ${ADMIN_EMAIL}. Nothing to do.`);
    } else {
      console.log(`An account exists for ${ADMIN_EMAIL} but it's a "${existing[0].role}" account, not admin.`);
      console.log(`Use a different email for the admin account, or change this user's role manually if you're sure.`);
    }
    process.exit(0);
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await pool.query(
    `INSERT INTO users (name, email, password, role, email_verified)
     VALUES ($1, $2, $3, 'admin', TRUE)`,
    [ADMIN_NAME, ADMIN_EMAIL, hash]
  );

  console.log("✅ Admin account created!");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log("");
  console.log("You can now log in at the app's normal sign-in screen with these");
  console.log("credentials — Kivo will detect the admin role and show the admin");
  console.log("dashboard automatically. Change the password after your first login.");
  process.exit(0);
}

main().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
