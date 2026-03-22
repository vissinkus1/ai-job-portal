const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendResetCodeEmail } = require("../utils/emailService");

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No account with that email" });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetCode = code;
        user.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();

        // Send via email
        await sendResetCodeEmail(user.email, code);

        res.json({
            message: "Reset code generated. Check your email.",
            code, // We can keep this for dev viewing in frontend, or remove for strict security
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.resetCode || user.resetCode !== code) {
            return res.status(400).json({ message: "Invalid reset code" });
        }

        if (user.resetCodeExpiry && user.resetCodeExpiry < new Date()) {
            return res.status(400).json({ message: "Reset code has expired" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetCode = undefined;
        user.resetCodeExpiry = undefined;
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
