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

function requireRole(role) {
  return (req, res, next) => {
    if (req.session?.role !== role) {
      return res.status(403).json({ error: `Only ${role}s can use this endpoint.` });
    }
    return next();
  };
}

function cleanMenuItem(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    price: Number(row.price),
    available: row.available,
  };
}

function cleanOrder(row) {
  return {
    id: row.public_id,
    dbId: row.id,
    vendor: row.vendor_name,
    customer: row.customer_name,
    items: row.items || [],
    total: Number(row.total),
    status: row.status,
    time: row.time_label || "Just now",
    live: row.status !== "Delivered" && row.status !== "Collected",
  };
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

app.get("/api/orders", requireAuth, requireRole("customer"), async (req, res) => {
  const result = await query(
    `
      select
        o.*,
        coalesce(
          json_agg(
            json_build_object('name', oi.name, 'qty', oi.qty, 'price', oi.price::float)
            order by oi.id
          ) filter (where oi.id is not null),
          '[]'::json
        ) as items,
        case
          when o.created_at > now() - interval '1 minute' then 'Just now'
          when o.created_at > now() - interval '1 hour' then floor(extract(epoch from now() - o.created_at) / 60)::int || ' mins ago'
          else to_char(o.created_at, 'Mon DD')
        end as time_label
      from orders o
      left join order_items oi on oi.order_id = o.id
      where o.customer_user_id = $1
      group by o.id
      order by o.created_at desc
    `,
    [req.session.sub],
  );

  res.json(result.rows.map(cleanOrder));
});

app.post("/api/orders", requireAuth, requireRole("customer"), async (req, res) => {
  const vendorName = String(req.body.vendorName || "").trim();
  const address = String(req.body.address || "").trim();
  const paymentMethod = String(req.body.paymentMethod || "cash").trim();
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const total = Number(req.body.total || 0);

  if (!vendorName) return res.status(400).json({ error: "Choose a restaurant before ordering." });
  if (address.length < 3) return res.status(400).json({ error: "Enter a delivery address." });
  if (!items.length) return res.status(400).json({ error: "Add items before placing an order." });
  if (!Number.isFinite(total) || total <= 0) return res.status(400).json({ error: "Order total is invalid." });
  const cleanedItems = items
    .map((item) => ({
      name: String(item.name || "").trim(),
      qty: Number(item.qty || 0),
      price: Number(item.price || 0),
    }))
    .filter((item) => item.name && Number.isFinite(item.qty) && item.qty > 0 && Number.isFinite(item.price) && item.price >= 0);

  if (!cleanedItems.length) return res.status(400).json({ error: "Order items are invalid." });

  const result = await query(
    `
      insert into orders (customer_user_id, vendor_name, delivery_address, payment_method, total)
      values ($1, $2, $3, $4, $5)
      returning *
    `,
    [req.session.sub, vendorName, address, paymentMethod, total],
  );

  const order = result.rows[0];
  for (const item of cleanedItems) {
    await query(
      "insert into order_items (order_id, name, qty, price) values ($1, $2, $3, $4)",
      [order.id, item.name, item.qty, item.price],
    );
  }

  res.status(201).json({ id: order.public_id });
});

app.get("/api/vendor/menu", requireAuth, requireRole("vendor"), async (req, res) => {
  const result = await query(
    "select * from menu_items where vendor_user_id = $1 order by created_at asc",
    [req.session.sub],
  );
  res.json(result.rows.map(cleanMenuItem));
});

app.post("/api/vendor/menu", requireAuth, requireRole("vendor"), async (req, res) => {
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();
  const image = String(req.body.image || "🍽️").trim() || "🍽️";
  const price = Number(req.body.price || 0);
  const available = req.body.available !== false;

  if (name.length < 2) return res.status(400).json({ error: "Enter an item name." });
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "Enter a valid price." });

  const result = await query(
    `
      insert into menu_items (vendor_user_id, name, description, image, price, available)
      values ($1, $2, $3, $4, $5, $6)
      returning *
    `,
    [req.session.sub, name, description, image, price, available],
  );

  res.status(201).json(cleanMenuItem(result.rows[0]));
});

app.put("/api/vendor/menu/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();
  const image = String(req.body.image || "🍽️").trim() || "🍽️";
  const price = Number(req.body.price || 0);
  const available = req.body.available !== false;

  if (name.length < 2) return res.status(400).json({ error: "Enter an item name." });
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "Enter a valid price." });

  const result = await query(
    `
      update menu_items
      set name = $3, description = $4, image = $5, price = $6, available = $7, updated_at = now()
      where id = $1 and vendor_user_id = $2
      returning *
    `,
    [req.params.id, req.session.sub, name, description, image, price, available],
  );

  if (!result.rows[0]) return res.status(404).json({ error: "Menu item not found." });
  res.json(cleanMenuItem(result.rows[0]));
});

app.delete("/api/vendor/menu/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  await query("delete from menu_items where id = $1 and vendor_user_id = $2", [req.params.id, req.session.sub]);
  res.status(204).end();
});

app.get("/api/vendor/orders", requireAuth, requireRole("vendor"), async (req, res) => {
  const result = await query(
    `
      select
        o.*,
        u.name as customer_name,
        coalesce(
          json_agg(
            json_build_object('name', oi.name, 'qty', oi.qty, 'price', oi.price::float)
            order by oi.id
          ) filter (where oi.id is not null),
          '[]'::json
        ) as items,
        case
          when o.created_at > now() - interval '1 minute' then 'Just now'
          when o.created_at > now() - interval '1 hour' then floor(extract(epoch from now() - o.created_at) / 60)::int || ' mins ago'
          else to_char(o.created_at, 'Mon DD')
        end as time_label
      from orders o
      join users u on u.id = o.customer_user_id
      where o.vendor_user_id = $1 or o.vendor_name = (
        select business_name from vendor_profiles where user_id = $1
      )
      group by o.id, u.name
      order by o.created_at desc
    `,
    [req.session.sub],
  );

  res.json(result.rows.map(cleanOrder));
});

app.patch("/api/vendor/orders/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  const status = String(req.body.status || "").trim();
  const allowed = new Set(["Pending", "Cooking", "Ready", "Collected", "Delivered"]);
  if (!allowed.has(status)) return res.status(400).json({ error: "Invalid order status." });

  const result = await query(
    `
      update orders
      set status = $3, updated_at = now()
      where (id::text = $1 or public_id = $1)
        and (vendor_user_id = $2 or vendor_name = (
          select business_name from vendor_profiles where user_id = $2
        ))
      returning public_id
    `,
    [req.params.id, req.session.sub, status],
  );

  if (!result.rows[0]) return res.status(404).json({ error: "Order not found." });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Kivo API running on http://localhost:${PORT}`);
});
