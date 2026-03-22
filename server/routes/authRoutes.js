const express = require("express");
const router = express.Router();
const { registerUser, loginUser, updatePassword, deleteAccount } = require("../controllers/authController");
const { forgotPassword, resetPassword } = require("../controllers/resetController");
const auth = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/update-password", auth, updatePassword);
router.delete("/delete-account", auth, deleteAccount);

// Protected route example
router.get("/me", auth, (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
});

module.exports = router;
