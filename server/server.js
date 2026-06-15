require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { migrate } = require("./db");

const authRoutes    = require("./routes/auth");
const vendorRoutes  = require("./routes/vendors");
const orderRoutes   = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const { router: sseRouter } = require("./routes/sse");

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowed =
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||   // localhost
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||          // 192.168.x.x
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||           // 10.x.x.x
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin); // 172.16–31.x.x

    if (allowed) return callback(null, true);
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);

    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders",  orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/sse",     sseRouter);

app.get("/health", (_, res) => res.json({ ok: true, ts: new Date() }));

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

migrate()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Kivo API running on http://localhost:${PORT}`);
      console.log(`🌐 Network access enabled on all interfaces`);
    });
  })
  .catch(err => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  });
