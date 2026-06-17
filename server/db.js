const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err) => {
  console.error("Unexpected DB error:", err.message);
});

// ─── SCHEMA MIGRATION ────────────────────────────────────────────────────────
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      phone       TEXT,
      address     TEXT,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'customer',   -- 'customer' | 'vendor'
      business_name TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id          SERIAL PRIMARY KEY,
      email       TEXT NOT NULL,
      code        TEXT NOT NULL,
      purpose     TEXT NOT NULL DEFAULT 'verify_email', -- 'verify_email' | 'reset_password'
      expires_at  TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS otp_codes_email_idx ON otp_codes(email);

    CREATE TABLE IF NOT EXISTS vendors (
      id            SERIAL PRIMARY KEY,
      user_id       INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      category      TEXT,
      description   TEXT,
      image         TEXT DEFAULT '🍽️',
      tag           TEXT,
      tag_color     TEXT DEFAULT '#ff6b35',
      rating        NUMERIC(3,1) DEFAULT 5.0,
      review_count  INT DEFAULT 0,
      distance      TEXT DEFAULT '1.0 km',
      delivery_time TEXT DEFAULT '20–35 min',
      delivery_fee  NUMERIC(6,2) DEFAULT 2.00,
      is_open       BOOLEAN DEFAULT TRUE,
      latitude      NUMERIC(10,7),
      longitude     NUMERIC(10,7),
      address       TEXT,
      cover_image_url TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id          SERIAL PRIMARY KEY,
      vendor_id   INT REFERENCES vendors(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT,
      price       NUMERIC(8,2) NOT NULL,
      image       TEXT DEFAULT '🍽️',
      image_url   TEXT,
      popular     BOOLEAN DEFAULT FALSE,
      available   BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id            SERIAL PRIMARY KEY,
      ref           TEXT UNIQUE NOT NULL,           -- e.g. KV-5041
      customer_id   INT REFERENCES users(id),
      vendor_id     INT REFERENCES vendors(id),
      status        TEXT NOT NULL DEFAULT 'Pending', -- Pending|Accepted|Cooking|Ready|Delivered
      address       TEXT,
      payment_method TEXT DEFAULT 'cash',
      subtotal      NUMERIC(8,2) NOT NULL,
      delivery_fee  NUMERIC(6,2) NOT NULL DEFAULT 2.00,
      total         NUMERIC(8,2) NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id          SERIAL PRIMARY KEY,
      order_id    INT REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INT REFERENCES menu_items(id),
      name        TEXT NOT NULL,   -- snapshot at order time
      price       NUMERIC(8,2) NOT NULL,
      qty         INT NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id               SERIAL PRIMARY KEY,
      order_id         INT UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      vendor_user_id   INT REFERENCES users(id) ON DELETE CASCADE,
      customer_user_id INT REFERENCES users(id) ON DELETE CASCADE,
      rating           INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment          TEXT NOT NULL DEFAULT '',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS reviews_vendor_user_id_idx ON reviews(vendor_user_id);

    -- Keep updated_at current automatically
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS orders_updated_at ON orders;
    CREATE TRIGGER orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  console.log("✅  DB schema ready");

  // ── Safe column additions for existing databases ──────────────────────────
  const safeAlters = [
    "alter table users   add column if not exists address   text",
    "alter table users   add column if not exists email_verified boolean not null default false",
    "alter table vendors add column if not exists latitude  numeric(10,7)",
    "alter table vendors add column if not exists longitude numeric(10,7)",
    "alter table vendors add column if not exists address   text",
    "alter table vendors add column if not exists cover_image_url text",
    "alter table menu_items add column if not exists image_url text",
    "alter table reviews add column if not exists id serial",  // no-op if exists
  ];
  for (const sql of safeAlters) {
    await pool.query(sql).catch(() => {});
  }
}

module.exports = { pool, migrate };
