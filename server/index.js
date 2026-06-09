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

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

// POST /api/orders/:id/review  — customer leaves review after delivery
app.post("/api/orders/:id/review", requireAuth, requireRole("customer"), async (req, res) => {
  const rating  = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be 1–5." });
  }

  // Fetch the order — must belong to this customer and be Delivered
  const orderResult = await query(
    `select o.id, o.customer_user_id, o.vendor_user_id, o.status, o.vendor_name,
            vp.user_id as vendor_owner_id
     from orders o
     left join vendor_profiles vp on vp.business_name = o.vendor_name
     where (o.id::text = $1 or o.public_id = $1)`,
    [req.params.id],
  );
  const order = orderResult.rows[0];
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.customer_user_id !== req.session.sub) return res.status(403).json({ error: "Not your order." });
  if (order.status !== "Delivered") return res.status(400).json({ error: "You can only review delivered orders." });

  const vendorUserId = order.vendor_user_id || order.vendor_owner_id;

  try {
    const result = await query(
      `insert into reviews (order_id, vendor_user_id, customer_user_id, rating, comment)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [order.id, vendorUserId, req.session.sub, rating, comment],
    );

    // Recompute vendor aggregate rating
    if (vendorUserId) {
      await query(
        `update vendors
         set rating       = (select round(avg(r.rating)::numeric, 1) from reviews r where r.vendor_user_id = $1),
             review_count = (select count(*) from reviews r where r.vendor_user_id = $1)
         where user_id = $1`,
        [vendorUserId],
      );
    }

    res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "You have already reviewed this order." });
    throw err;
  }
});

// GET /api/vendors/:id/reviews  — public, paginated
app.get("/api/vendors/:id/reviews", async (req, res) => {
  const limit  = Math.min(Number(req.query.limit)  || 20, 50);
  const offset = Number(req.query.offset) || 0;

  const result = await query(
    `select r.id, r.rating, r.comment, r.created_at, u.name as customer_name
     from reviews r
     join users u on u.id = r.customer_user_id
     where r.vendor_user_id = (
       select user_id from vendors where id = $1
     )
     order by r.created_at desc
     limit $2 offset $3`,
    [req.params.id, limit, offset],
  );

  const countResult = await query(
    `select count(*) from reviews where vendor_user_id = (select user_id from vendors where id = $1)`,
    [req.params.id],
  );

  res.json({ reviews: result.rows, total: Number(countResult.rows[0].count) });
});

// ─── VENDOR HISTORY + REVENUE STATS ──────────────────────────────────────────

// GET /api/vendor/orders/history  — delivered/cancelled orders + revenue summary
app.get("/api/vendor/orders/history", requireAuth, requireRole("vendor"), async (req, res) => {
  const limit  = Math.min(Number(req.query.limit)  || 30, 100);
  const offset = Number(req.query.offset) || 0;

  const result = await query(
    `select
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
         when o.created_at > now() - interval '7 days'  then to_char(o.created_at, 'Dy HH12:MI AM')
         else to_char(o.created_at, 'Mon DD')
       end as time_label
     from orders o
     join users u on u.id = o.customer_user_id
     where (o.vendor_user_id = $1 or o.vendor_name = (
       select business_name from vendor_profiles where user_id = $1
     ))
     and o.status in ('Delivered', 'Collected', 'Cancelled')
     group by o.id, u.name
     order by o.created_at desc
     limit $2 offset $3`,
    [req.session.sub, limit, offset],
  );

  // Revenue stats (today / this week / all time, delivered only)
  const statsResult = await query(
    `select
       count(*) filter (where o.status in ('Delivered','Collected'))                                    as total_orders,
       coalesce(sum(o.total) filter (where o.status in ('Delivered','Collected')), 0)                   as total_revenue,
       count(*) filter (where o.status in ('Delivered','Collected') and o.created_at >= now() - interval '7 days') as week_orders,
       coalesce(sum(o.total) filter (where o.status in ('Delivered','Collected') and o.created_at >= now() - interval '7 days'), 0) as week_revenue,
       count(*) filter (where o.status in ('Delivered','Collected') and o.created_at >= date_trunc('day', now()))  as today_orders,
       coalesce(sum(o.total) filter (where o.status in ('Delivered','Collected') and o.created_at >= date_trunc('day', now())), 0)  as today_revenue
     from orders o
     where o.vendor_user_id = $1 or o.vendor_name = (
       select business_name from vendor_profiles where user_id = $1
     )`,
    [req.session.sub],
  );

  const s = statsResult.rows[0];
  res.json({
    orders: result.rows.map(cleanOrder),
    stats: {
      totalOrders:  Number(s.total_orders),
      totalRevenue: Number(s.total_revenue),
      weekOrders:   Number(s.week_orders),
      weekRevenue:  Number(s.week_revenue),
      todayOrders:  Number(s.today_orders),
      todayRevenue: Number(s.today_revenue),
    },
  });
});

// ─── CUSTOMER PROFILE STATS ───────────────────────────────────────────────────

// GET /api/auth/me/stats
app.get("/api/auth/me/stats", requireAuth, async (req, res) => {
  const result = await query(
    `select
       count(*) filter (where status in ('Delivered','Collected')) as completed_orders,
       count(*) filter (where status not in ('Delivered','Collected','Cancelled')) as active_orders,
       coalesce(sum(total) filter (where status in ('Delivered','Collected')), 0) as total_spent
     from orders
     where customer_user_id = $1`,
    [req.session.sub],
  );
  const r = result.rows[0];
  res.json({
    completedOrders: Number(r.completed_orders),
    activeOrders:    Number(r.active_orders),
    totalSpent:      Number(r.total_spent),
  });
});

app.listen(PORT, () => {
  console.log(`Kivo API running on http://localhost:${PORT}`);
});
