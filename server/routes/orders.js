const router = require("express").Router();
const { pool } = require("../db");
const { auth, requireRole } = require("../middleware/auth");
// SSE emitters — lazy-required to avoid circular deps at startup
function sse() { return require("./sse"); }

function makeRef() {
  return "KV-" + Math.floor(1000 + Math.random() * 9000);
}

async function fullOrder(orderId) {
  const { rows: oRows } = await pool.query(
    `SELECT o.*, v.name as vendor_name, v.delivery_time,
            u.name as customer_name, u.phone as customer_phone
     FROM orders o
     JOIN vendors v ON v.id=o.vendor_id
     JOIN users u ON u.id=o.customer_id
     WHERE o.id=$1`,
    [orderId]
  );
  if (!oRows[0]) return null;
  const { rows: items } = await pool.query("SELECT * FROM order_items WHERE order_id=$1", [orderId]);
  return { ...oRows[0], items };
}

const STATUS_FLOW = ["Pending", "Accepted", "Cooking", "Ready", "Delivered"];

// ─── VENDOR ROUTES (before /:id) ──────────────────────────────────────────────

// GET /api/orders/vendor/active
router.get("/vendor/active", auth, requireRole("vendor"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });
  const { rows } = await pool.query(
    `SELECT o.*, u.name as customer_name, u.phone as customer_phone
     FROM orders o JOIN users u ON u.id=o.customer_id
     WHERE o.vendor_id=$1 AND o.status NOT IN ('Delivered','Cancelled')
     ORDER BY o.created_at DESC`,
    [vRows[0].id]
  );
  const orders = await Promise.all(rows.map(o => fullOrder(o.id)));
  res.json({ orders });
});

// GET /api/orders/vendor/history
router.get("/vendor/history", auth, requireRole("vendor"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });
  const { rows } = await pool.query(
    `SELECT o.*, u.name as customer_name
     FROM orders o JOIN users u ON u.id=o.customer_id
     WHERE o.vendor_id=$1 AND o.status IN ('Delivered','Cancelled')
     ORDER BY o.created_at DESC LIMIT 50`,
    [vRows[0].id]
  );
  const orders = await Promise.all(rows.map(o => fullOrder(o.id)));
  res.json({ orders });
});

// ─── CUSTOMER ROUTES ──────────────────────────────────────────────────────────

// POST /api/orders
router.post("/", auth, requireRole("customer"), async (req, res) => {
  const { vendorId, items, address, paymentMethod = "cash" } = req.body;
  if (!vendorId || !items?.length || !address) {
    return res.status(400).json({ error: "vendorId, items and address are required." });
  }

  const { rows: vRows } = await pool.query("SELECT * FROM vendors WHERE id=$1", [vendorId]);
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });

  const itemIds = items.map(i => i.menuItemId);
  const { rows: menuRows } = await pool.query(
    "SELECT * FROM menu_items WHERE id = ANY($1) AND vendor_id=$2 AND available=TRUE",
    [itemIds, vendorId]
  );
  const menuMap = Object.fromEntries(menuRows.map(m => [m.id, m]));
  const missingId = itemIds.find(id => !menuMap[id]);
  if (missingId) return res.status(400).json({ error: `Menu item ${missingId} is unavailable.` });

  const subtotal    = items.reduce((s, i) => s + Number(menuMap[i.menuItemId].price) * i.qty, 0);
  const deliveryFee = Number(vRows[0].delivery_fee);
  const total       = subtotal + deliveryFee;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let ref, refOk = false;
    while (!refOk) {
      ref = makeRef();
      const { rows } = await client.query("SELECT id FROM orders WHERE ref=$1", [ref]);
      if (!rows.length) refOk = true;
    }

    const { rows: oRows } = await client.query(
      `INSERT INTO orders (ref, customer_id, vendor_id, address, payment_method, subtotal, delivery_fee, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [ref, req.user.id, vendorId, address, paymentMethod, subtotal, deliveryFee, total]
    );
    const order = oRows[0];

    for (const item of items) {
      const mi = menuMap[item.menuItemId];
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, qty) VALUES ($1,$2,$3,$4,$5)`,
        [order.id, mi.id, mi.name, mi.price, item.qty]
      );
    }

    await client.query("COMMIT");
    const placed = await fullOrder(order.id);
    sse().emitNewOrder(placed);
    res.status(201).json({ order: placed });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Order error:", err.message);
    res.status(500).json({ error: "Failed to place order." });
  } finally {
    client.release();
  }
});

// GET /api/orders
router.get("/", auth, requireRole("customer"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id FROM orders o WHERE o.customer_id=$1 ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  const orders = await Promise.all(rows.map(o => fullOrder(o.id)));
  res.json({ orders });
});

// GET /api/orders/:id
router.get("/:id", auth, async (req, res) => {
  const order = await fullOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (req.user.role === "customer" && order.customer_id !== req.user.id) {
    return res.status(403).json({ error: "Not your order." });
  }
  res.json({ order });
});

// PATCH /api/orders/:id/status  — vendor advances
router.patch("/:id/status", auth, requireRole("vendor"), async (req, res) => {
  const { status } = req.body;
  if (!STATUS_FLOW.includes(status)) return res.status(400).json({ error: "Invalid status." });

  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  const { rows: oRows } = await pool.query(
    "SELECT * FROM orders WHERE id=$1 AND vendor_id=$2",
    [req.params.id, vRows[0]?.id]
  );
  if (!oRows[0]) return res.status(404).json({ error: "Order not found." });

  const { rows } = await pool.query(
    "UPDATE orders SET status=$1 WHERE id=$2 RETURNING *",
    [status, req.params.id]
  );
  const updated = await fullOrder(rows[0].id);
  sse().emitOrderUpdate(updated);
  res.json({ order: updated });
});

// DELETE /api/orders/:id  — vendor cancels
router.delete("/:id", auth, requireRole("vendor"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  const { rows } = await pool.query(
    "UPDATE orders SET status='Cancelled' WHERE id=$1 AND vendor_id=$2 RETURNING *",
    [req.params.id, vRows[0]?.id]
  );
  if (rows[0]) {
    const updated = await fullOrder(rows[0].id);
    sse().emitOrderUpdate(updated);
  }
  res.json({ ok: true });
});

module.exports = router;
