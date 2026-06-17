const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const { generateCode, sendOtpEmail } = require("../email");

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS_WINDOW_MIN = 60; // rate-limit window
const OTP_MAX_SENDS_PER_WINDOW = 5;

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function safeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address || null,
    role: row.role,
    businessName: row.business_name,
    emailVerified: row.email_verified,
  };
}

async function issueOtp(email, purpose) {
  // Basic rate limit: don't allow spamming codes
  const { rows: recentRows } = await pool.query(
    `SELECT COUNT(*) FROM otp_codes
     WHERE email=$1 AND purpose=$2 AND created_at > NOW() - INTERVAL '${OTP_MAX_ATTEMPTS_WINDOW_MIN} minutes'`,
    [email, purpose]
  );
  if (Number(recentRows[0].count) >= OTP_MAX_SENDS_PER_WINDOW) {
    return { rateLimited: true };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES ($1,$2,$3,$4)`,
    [email, code, purpose, expiresAt]
  );

  const result = await sendOtpEmail(email, code, purpose);
  return { rateLimited: false, ...result };
}

async function verifyOtp(email, code, purpose) {
  const { rows } = await pool.query(
    `SELECT * FROM otp_codes
     WHERE email=$1 AND purpose=$2 AND code=$3 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose, code]
  );
  const otp = rows[0];
  if (!otp) return { valid: false, reason: "Incorrect code." };
  if (new Date(otp.expires_at) < new Date()) return { valid: false, reason: "Code expired. Request a new one." };

  await pool.query("UPDATE otp_codes SET consumed_at = NOW() WHERE id=$1", [otp.id]);
  return { valid: true };
}

// POST /api/auth/register — creates the account (unverified) and sends a code
router.post("/register", async (req, res) => {
  const { name, email, phone, password, role = "customer", businessName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (!["customer", "vendor"].includes(role)) {
    return res.status(400).json({ error: "Role must be customer or vendor." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query("SELECT id, email_verified FROM users WHERE email=$1", [email]);
    if (exists.rows.length) {
      await client.query("ROLLBACK");
      if (exists.rows[0].email_verified) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }
      // Unverified account re-registering — let them resend instead of blocking
      return res.status(409).json({ error: "This email is already registered but not verified. Please verify it.", unverified: true });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      `INSERT INTO users (name, email, phone, password, role, business_name, email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE) RETURNING *`,
      [name, email, phone || null, hash, role, businessName || null]
    );

    const user = rows[0];

    if (role === "vendor") {
      await client.query(
        `INSERT INTO vendors (user_id, name, category, description)
         VALUES ($1,$2,$3,$4)`,
        [user.id, businessName || name, "Local Food", "Welcome to our restaurant!"]
      );
    }

    await client.query("COMMIT");

    await issueOtp(email, "verify_email");

    res.status(201).json({
      pendingVerification: true,
      email: user.email,
      message: "We sent a 6-digit code to your email. Enter it to finish creating your account.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  } finally {
    client.release();
  }
});

// POST /api/auth/verify-email — confirms the code and logs the user in
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code are required." });

  const result = await verifyOtp(email, code, "verify_email");
  if (!result.valid) return res.status(400).json({ error: result.reason });

  const { rows } = await pool.query(
    "UPDATE users SET email_verified = TRUE WHERE email=$1 RETURNING *",
    [email]
  );
  if (!rows[0]) return res.status(404).json({ error: "Account not found." });

  const user = rows[0];
  res.json({ user: safeUser(user), token: makeToken(user) });
});

// POST /api/auth/resend-code — re-sends a verification or reset code
router.post("/resend-code", async (req, res) => {
  const { email, purpose = "verify_email" } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });
  if (!["verify_email", "reset_password"].includes(purpose)) {
    return res.status(400).json({ error: "Invalid purpose." });
  }

  const { rows } = await pool.query("SELECT id, email_verified FROM users WHERE email=$1", [email]);
  if (!rows[0]) return res.status(404).json({ error: "No account found with that email." });
  if (purpose === "verify_email" && rows[0].email_verified) {
    return res.status(400).json({ error: "This email is already verified." });
  }

  const result = await issueOtp(email, purpose);
  if (result.rateLimited) {
    return res.status(429).json({ error: "Too many code requests. Please wait a while before trying again." });
  }

  res.json({ ok: true, message: "A new code has been sent to your email." });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!user.email_verified) {
    // Not verified yet — push them back into the OTP flow rather than letting them in
    await issueOtp(email, "verify_email");
    return res.status(403).json({
      error: "Please verify your email before signing in. We just sent you a new code.",
      pendingVerification: true,
      email: user.email,
    });
  }

  res.json({ user: safeUser(user), token: makeToken(user) });
});

// POST /api/auth/forgot-password — sends a reset code
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  const { rows } = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
  // Always respond the same way whether or not the account exists, to avoid leaking which emails are registered
  if (rows[0]) {
    const result = await issueOtp(email, "reset_password");
    if (result.rateLimited) {
      return res.status(429).json({ error: "Too many requests. Please wait a while before trying again." });
    }
  }
  res.json({ ok: true, message: "If that email is registered, a reset code has been sent." });
});

// POST /api/auth/reset-password — verifies code + sets new password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, code and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const result = await verifyOtp(email, code, "reset_password");
  if (!result.valid) return res.status(400).json({ error: result.reason });

  const hash = await bcrypt.hash(newPassword, 12);
  const { rows } = await pool.query(
    "UPDATE users SET password=$1 WHERE email=$2 RETURNING *",
    [hash, email]
  );
  if (!rows[0]) return res.status(404).json({ error: "Account not found." });

  const user = rows[0];
  res.json({ user: safeUser(user), token: makeToken(user) });
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "User not found." });
  res.json({ user: safeUser(rows[0]) });
});

// PATCH /api/auth/me/update — update name / phone / address
router.patch("/me/update", auth, async (req, res) => {
  const { name, phone, address } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET
       name    = COALESCE($1, name),
       phone   = COALESCE($2, phone),
       address = COALESCE($3, address)
     WHERE id=$4 RETURNING *`,
    [name || null, phone || null, address || null, req.user.id]
  );
  res.json({ user: safeUser(rows[0]) });
});

// GET /api/auth/me/stats — order count / spend summary (customer)
router.get("/me/stats", auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'Delivered')                         AS completed_orders,
       COUNT(*) FILTER (WHERE status NOT IN ('Delivered','Cancelled'))      AS active_orders,
       COALESCE(SUM(total) FILTER (WHERE status = 'Delivered'), 0)          AS total_spent
     FROM orders
     WHERE customer_id = $1`,
    [req.user.id]
  );
  const r = rows[0];
  res.json({
    completedOrders: Number(r.completed_orders),
    activeOrders:    Number(r.active_orders),
    totalSpent:      Number(r.total_spent),
  });
});

module.exports = router;
