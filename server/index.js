import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { requireAuth, signSession } from "./auth.js";
import { query } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowedOrigins = new Set([CLIENT_ORIGIN]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || origin?.startsWith("http://localhost:")) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

function cleanUser(row) {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
    businessName: row.business_name || null,
    createdAt: row.created_at,
  };
}

function isValidRole(role) {
  return role === "customer" || role === "vendor";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.get("/api/health", async (_req, res) => {
  try {
    await query("select 1");
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(503).json({ ok: false, database: "unavailable", error: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const role = String(req.body.role || "").trim();
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");
  const businessName = String(req.body.businessName || "").trim();

  if (!isValidRole(role)) return res.status(400).json({ error: "Choose customer or vendor." });
  if (name.length < 2) return res.status(400).json({ error: "Enter your full name." });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (phone.length < 7) return res.status(400).json({ error: "Enter a valid phone number." });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (role === "vendor" && businessName.length < 2) return res.status(400).json({ error: "Enter your business name." });

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await query(
      `
        with inserted_user as (
          insert into users (role, name, email, phone, password_hash)
          values ($1, $2, $3, $4, $5)
          returning id, role, name, email, phone, created_at
        ),
        inserted_profile as (
          insert into vendor_profiles (user_id, business_name)
          select id, $6 from inserted_user where role = 'vendor'
          returning business_name
        ),
        inserted_customer as (
          insert into customer_profiles (user_id)
          select id from inserted_user where role = 'customer'
          returning user_id
        )
        select inserted_user.*, inserted_profile.business_name
        from inserted_user
        left join inserted_profile on true
      `,
      [role, name, email, phone, passwordHash, businessName],
    );

    const user = cleanUser(result.rows[0]);
    res.status(201).json({ user, token: signSession(user) });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "An account with that email or phone already exists." });
    }
    return res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const result = await query(
    `
      select u.id, u.role, u.name, u.email, u.phone, u.password_hash, u.created_at, vp.business_name
      from users u
      left join vendor_profiles vp on vp.user_id = u.id
      where u.email = $1
    `,
    [email],
  );

  const row = result.rows[0];
  if (!row) return res.status(401).json({ error: "Invalid email or password." });

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password." });

  const user = cleanUser(row);
  res.json({ user, token: signSession(user) });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const result = await query(
    `
      select u.id, u.role, u.name, u.email, u.phone, u.created_at, vp.business_name
      from users u
      left join vendor_profiles vp on vp.user_id = u.id
      where u.id = $1
    `,
    [req.session.sub],
  );

  if (!result.rows[0]) return res.status(404).json({ error: "Account not found." });
  res.json({ user: cleanUser(result.rows[0]) });
});

app.listen(PORT, () => {
  console.log(`Kivo API running on http://localhost:${PORT}`);
});
