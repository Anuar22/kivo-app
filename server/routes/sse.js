/**
 * Server-Sent Events for real-time order status updates.
 *
 * Customers subscribe to their order:  GET /api/sse/order/:orderId
 * Vendors subscribe to their queue:    GET /api/sse/vendor
 *
 * When an order status changes (via PATCH /api/orders/:id/status),
 * the orders route emits an event here.
 */

const { auth } = require("../middleware/auth");

// In-memory registry of open SSE connections
const orderSubs = new Map();   // orderId -> Set<res>
const vendorSubs = new Map();  // vendorId -> Set<res>

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function keepAlive(res) {
  return setInterval(() => res.write(": ping\n\n"), 25000);
}

// ─── SUBSCRIBE ────────────────────────────────────────────────────────────────

function customerSSE(req, res) {
  const orderId = String(req.params.orderId);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  send(res, "connected", { orderId });
  const ping = keepAlive(res);

  if (!orderSubs.has(orderId)) orderSubs.set(orderId, new Set());
  orderSubs.get(orderId).add(res);

  req.on("close", () => {
    clearInterval(ping);
    orderSubs.get(orderId)?.delete(res);
  });
}

function vendorSSE(req, res) {
  const vendorId = String(req.vendorId);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  send(res, "connected", { vendorId });
  const ping = keepAlive(res);

  if (!vendorSubs.has(vendorId)) vendorSubs.set(vendorId, new Set());
  vendorSubs.get(vendorId).add(res);

  req.on("close", () => {
    clearInterval(ping);
    vendorSubs.get(vendorId)?.delete(res);
  });
}

// ─── EMIT (called by orders route after status change) ────────────────────────

function emitOrderUpdate(order) {
  const orderId = String(order.id);
  const vendorId = String(order.vendor_id);

  // Notify customer tracking this order
  orderSubs.get(orderId)?.forEach(res => send(res, "order_update", order));

  // Notify vendor dashboard
  vendorSubs.get(vendorId)?.forEach(res => send(res, "order_update", order));
}

function emitNewOrder(order) {
  const vendorId = String(order.vendor_id);
  vendorSubs.get(vendorId)?.forEach(res => send(res, "new_order", order));
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const router = require("express").Router();
const { pool } = require("../db");

// Customer: subscribe to a single order
router.get("/order/:orderId", auth, (req, res) => {
  customerSSE(req, res);
});

// Vendor: subscribe to their incoming orders feed
router.get("/vendor", auth, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ error: "Vendors only." });
  }
  const { rows } = await pool.query(
    "SELECT id FROM vendors WHERE user_id=$1", [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Vendor not found." });
  req.vendorId = rows[0].id;
  vendorSSE(req, res);
});

module.exports = { router, emitOrderUpdate, emitNewOrder };
