const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  // EventSource can't set headers, so we also accept ?token= for SSE routes
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.query.token || null;

  if (!token) return res.status(401).json({ error: "No token provided." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Only allow a specific role
function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: `Requires ${role} role.` });
    }
    next();
  };
}

module.exports = { auth, requireRole };
