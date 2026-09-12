const User = require("../models/User");

/**
 * Middleware factory — restricts access to specific roles.
 * Usage: router.post("/jobs", auth, roleGuard("employer"), createJob);
 */
module.exports = function roleGuard(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id).select("role");
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    message: `Access denied. This action requires ${allowedRoles.join(" or ")} role.`,
                });
            }

            req.userRole = user.role;
            next();
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: "Server error" });
        }
    };
};
