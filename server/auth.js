import jwt from "jsonwebtoken";

const DEFAULT_SECRET = "dev-only-change-me";

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET || DEFAULT_SECRET,
    { expiresIn: "7d" },
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing session token." });
  }

  try {
    req.session = jwt.verify(token, process.env.JWT_SECRET || DEFAULT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}
