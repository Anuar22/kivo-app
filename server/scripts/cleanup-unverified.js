// One-off utility: deletes a user account that registered but never
// verified their email. Run this if you got stuck testing registration
// before the OTP-sending bug was fixed, so you can re-register cleanly
// with the same email address.
//
// Usage: node scripts/cleanup-unverified.js you@example.com
require("dotenv").config();
const { pool } = require("../db");

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node scripts/cleanup-unverified.js <email>");
    process.exit(1);
  }

  const { rows } = await pool.query(
    "SELECT id, email, email_verified FROM users WHERE email=$1",
    [email]
  );

  if (!rows[0]) {
    console.log(`No account found for ${email}.`);
    process.exit(0);
  }
  if (rows[0].email_verified) {
    console.log(`${email} is already verified — not deleting. Use login/forgot-password instead.`);
    process.exit(0);
  }

  await pool.query("DELETE FROM users WHERE id=$1", [rows[0].id]);
  console.log(`Deleted unverified account for ${email}. You can register again now.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
