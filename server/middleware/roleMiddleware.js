const User = require("../models/User");

/**
 * Middleware factory to enforce user role.
 * Usage: requireRole("employer") or requireRole("seeker")
 */
module.exports = function requireRole(role) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("role");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role !== role) {
        return res.status(403).json({
          message: `Access denied. ${role.charAt(0).toUpperCase() + role.slice(1)} role required.`,
        });
      }
      next();
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  };
};
