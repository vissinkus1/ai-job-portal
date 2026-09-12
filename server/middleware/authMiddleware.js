const jwt = require("jsonwebtoken");

/**
 * Primary auth middleware — requires a valid access token.
 * Supports both `x-auth-token` header and `Authorization: Bearer <token>`.
 */
function auth(req, res, next) {
  // Try x-auth-token first (legacy), then Authorization: Bearer
  let token = req.header("x-auth-token");
  if (!token) {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    // Differentiate between expired and invalid tokens
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
}

/**
 * Optional auth — same logic but doesn't reject if no token.
 * Sets req.user if valid token present, otherwise continues without it.
 * Useful for public endpoints that show extra data to logged-in users.
 */
function optionalAuth(req, res, next) {
  let token = req.header("x-auth-token");
  if (!token) {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return next(); // No token = anonymous access, continue
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
  } catch {
    // Invalid/expired token for optional auth — just continue as anonymous
  }
  next();
}

/**
 * Role guard middleware factory.
 * Usage: router.get("/admin", auth, roleGuard(["admin"]), handler)
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ["employer", "admin"])
 */
function roleGuard(allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Lazy-load User model to avoid circular dependency
      const User = require("../models/User");
      const user = await User.findById(req.user.id).select("role").lean();

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      // Attach role to req.user for downstream use
      req.user.role = user.role;
      next();
    } catch (error) {
      console.error("[RoleGuard]", error.message);
      res.status(500).json({ message: "Server error" });
    }
  };
}

module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.roleGuard = roleGuard;
