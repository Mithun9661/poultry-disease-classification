const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = String(req.headers.authorization || "");

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  const token = authHeader.slice(7).trim();
  if (!token || token.length > 4096) {
    return res.status(401).json({ message: "Invalid authentication token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded?.userId || !/^[a-f\d]{24}$/i.test(String(decoded.userId))) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }
    req.userId = decoded.userId;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

module.exports = requireAuth;
