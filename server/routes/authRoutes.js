const express = require("express");
const { body } = require("express-validator");
const {
    registerUser,
    loginUser,
    updatePassword,
    deleteAccount,
    verifyEmail,
    resendVerification,
    refreshToken,
    logout,
    getSessions,
    revokeSession,
    getDevCode,
} = require("../controllers/authController");
const { forgotPassword, resetPassword } = require("../controllers/resetController");
const auth = require("../middleware/authMiddleware");

// Export a factory function that accepts rate limiters
module.exports = function (authLimiter, verifyLimiter) {
    const router = express.Router();

    router.post(
        "/register",
        authLimiter,
        [
            body("name")
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage("Name must be between 2 and 50 characters"),
            body("email")
                .isEmail()
                .normalizeEmail()
                .withMessage("Please provide a valid email address"),
            body("password")
                .isLength({ min: 6 })
                .withMessage("Password must be at least 6 characters"),
        ],
        registerUser
    );

    router.post(
        "/login",
        authLimiter,
        [
            body("email").isEmail().withMessage("Please provide a valid email"),
            body("password").notEmpty().withMessage("Password is required"),
        ],
        loginUser
    );

    router.post("/forgot-password", authLimiter, forgotPassword);
    router.post("/reset-password", authLimiter, resetPassword);
    router.post("/verify-email", verifyLimiter, verifyEmail);
    router.post("/resend-verification", verifyLimiter, resendVerification);
    router.get("/dev-code", getDevCode);
    router.put("/update-password", auth, updatePassword);
    router.delete("/delete-account", auth, deleteAccount);

    // Refresh token rotation (no auth required — uses cookie)
    router.post("/refresh-token", refreshToken);

    // Logout (no auth required — uses cookie)
    router.post("/logout", logout);

    // Session management (auth required)
    router.get("/sessions", auth, getSessions);
    router.delete("/sessions/:id", auth, revokeSession);

    // Protected route check
    router.get("/me", auth, (req, res) => {
        res.json({ message: "This is a protected route", user: req.user });
    });

    return router;
};
