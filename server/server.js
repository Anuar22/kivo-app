require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { migrate } = require("./db");

const authRoutes    = require("./routes/auth");
const vendorRoutes  = require("./routes/vendors");
const orderRoutes   = require("./routes/orders");
const { router: sseRouter } = require("./routes/sse");

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders",  orderRoutes);
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
    app.listen(PORT, () => console.log(`🚀 Kivo API running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  });
