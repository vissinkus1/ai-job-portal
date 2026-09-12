const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail, sendVerificationEmail } = require("../utils/emailService");
const { validationResult } = require("express-validator");

// Helper: generate a short-lived access token
function generateAccessToken(userId) {
    return jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
    );
}

// Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Register User
exports.registerUser = async (req, res) => {
    // Check express-validator results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        user = new User({
            name,
            email,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        });

        await user.save();
        
        // Log OTP to console for development access
        console.log(`\n╔══════════════════════════════════════════╗`);
        console.log(`║  📧 VERIFICATION CODE for ${user.email}`);
        console.log(`║  🔑 Code: ${verificationCode}`);
        console.log(`║  ⏰ Expires in 30 minutes`);
        console.log(`╚══════════════════════════════════════════╝\n`);

        // Send welcome + verification emails (async, non-blocking)
        sendWelcomeEmail(user.email, user.name).catch(() => {});
        sendVerificationEmail(user.email, user.name, verificationCode).catch(() => {});

        const isDev = process.env.NODE_ENV !== "production" || !process.env.EMAIL_PASS;
        res.status(201).json({
            message: "User registered successfully. Check your email for verification code.",
            ...(isDev ? { devCode: verificationCode } : {})
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Login User — issues short-lived access token + refresh token cookie
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been suspended. Contact support for assistance." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate short-lived access token
        const accessToken = generateAccessToken(user.id);

        // Generate refresh token and set as httpOnly cookie
        const { rawToken } = await RefreshToken.createToken(user.id, req);
        res.cookie("refreshToken", rawToken, REFRESH_COOKIE_OPTIONS);

        res.json({
            token: accessToken,
            message: "Login successful",
            emailVerified: user.emailVerified,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/auth/update-password
// Update password for logged in user
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Revoke all refresh tokens on password change (security best practice)
        await RefreshToken.revokeAllForUser(req.user.id);

        // Issue a fresh token pair so current session stays alive
        const accessToken = generateAccessToken(user.id);
        const { rawToken } = await RefreshToken.createToken(user.id, req);
        res.cookie("refreshToken", rawToken, REFRESH_COOKIE_OPTIONS);

        res.json({ message: "Password updated successfully", token: accessToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/auth/delete-account
// Delete user account and all associated data
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Lazy load models for cascading deletes
        const Job = require("../models/Job");
        const Application = require("../models/Application");
        const Message = require("../models/Message");
        const Notification = require("../models/Notification");

        console.log(`[Account Deletion] Initiating delete for user ${user.email}`);

        // 1. If employer, delete all their posted jobs
        let deletedJobs = 0;
        if (user.role === "employer") {
            const jobs = await Job.find({ postedBy: userId });
            const jobIds = jobs.map((j) => j._id);
            // Delete applications for these jobs
            await Application.deleteMany({ job: { $in: jobIds } });
            // Delete the jobs themselves
            const jobResult = await Job.deleteMany({ postedBy: userId });
            deletedJobs = jobResult.deletedCount;
        }

        // 2. Delete all applications made by seeker
        const appResult = await Application.deleteMany({ applicant: userId });
        
        // 3. Delete all messages sent by or received by user
        const msgResult = await Message.deleteMany({
            $or: [{ sender: userId }, { receiver: userId }],
        });

        // 4. Delete all notifications for the user
        const notifResult = await Notification.deleteMany({ user: userId });

        // 5. Finally, delete the user document
        await User.findByIdAndDelete(userId);

        console.log(`[Account Deletion] Success. Deleted: ${deletedJobs} jobs, ${appResult.deletedCount} apps, ${msgResult.deletedCount} msgs, ${notifResult.deletedCount} notifs.`);
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.emailVerified) {
            return res.json({ message: "Email is already verified" });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
            return res.status(400).json({ message: "Verification code has expired. Request a new one." });
        }

        user.emailVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpiry = undefined;
        await user.save();

        res.json({ message: "Email verified successfully! 🎉" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.emailVerified) {
            return res.json({ message: "Email is already verified" });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = code;
        user.verificationCodeExpiry = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();

        // Log OTP to console for development access
        console.log(`\n╔══════════════════════════════════════════╗`);
        console.log(`║  📧 RESEND CODE for ${user.email}`);
        console.log(`║  🔑 Code: ${code}`);
        console.log(`║  ⏰ Expires in 30 minutes`);
        console.log(`╚══════════════════════════════════════════╝\n`);

        sendVerificationEmail(user.email, user.name, code).catch(() => {});

        const isDev = process.env.NODE_ENV !== "production" || !process.env.EMAIL_PASS;
        res.json({
            message: "Verification code sent! Check your email.",
            ...(isDev ? { devCode: code } : {})
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/auth/refresh-token — Rotate refresh token and issue new access token
exports.refreshToken = async (req, res) => {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
        return res.status(401).json({ message: "No refresh token", code: "NO_REFRESH_TOKEN" });
    }

    try {
        const tokenDoc = await RefreshToken.findByRawToken(rawToken);
        if (!tokenDoc || tokenDoc.isExpired()) {
            // Clear the invalid cookie
            res.clearCookie("refreshToken", { path: "/api/auth" });
            return res.status(401).json({ message: "Invalid or expired refresh token", code: "INVALID_REFRESH" });
        }

        // Rotate: delete old token, create new one
        await RefreshToken.deleteOne({ _id: tokenDoc._id });
        const { rawToken: newRawToken } = await RefreshToken.createToken(tokenDoc.userId, req);

        // Issue new access token
        const accessToken = generateAccessToken(tokenDoc.userId);

        // Set new refresh cookie
        res.cookie("refreshToken", newRawToken, REFRESH_COOKIE_OPTIONS);

        res.json({ token: accessToken });
    } catch (error) {
        console.error("[RefreshToken]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/auth/logout — Revoke refresh token and clear cookie
exports.logout = async (req, res) => {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
        try {
            const tokenDoc = await RefreshToken.findByRawToken(rawToken);
            if (tokenDoc) await RefreshToken.deleteOne({ _id: tokenDoc._id });
        } catch {
            // Ignore errors during logout cleanup
        }
    }

    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ message: "Logged out successfully" });
};

// GET /api/auth/sessions — List active sessions for the logged-in user
exports.getSessions = async (req, res) => {
    try {
        const sessions = await RefreshToken.find({ userId: req.user.id })
            .select("deviceInfo ip createdAt expiresAt")
            .sort("-createdAt")
            .lean();

        // Mark which session is the current one
        const currentRawToken = req.cookies?.refreshToken;
        let currentSessionId = null;
        if (currentRawToken) {
            const currentDoc = await RefreshToken.findByRawToken(currentRawToken);
            if (currentDoc) currentSessionId = currentDoc._id.toString();
        }

        const formatted = sessions.map((s) => ({
            id: s._id,
            device: s.deviceInfo,
            ip: s.ip,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            isCurrent: s._id.toString() === currentSessionId,
        }));

        res.json(formatted);
    } catch (error) {
        console.error("[Sessions]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/auth/sessions/:id — Revoke a specific session
exports.revokeSession = async (req, res) => {
    try {
        const result = await RefreshToken.deleteOne({
            _id: req.params.id,
            userId: req.user.id, // Ensure users can only revoke their own sessions
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Session not found" });
        }

        res.json({ message: "Session revoked" });
    } catch (error) {
        console.error("[RevokeSession]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/auth/dev-code?email=... (Only accessible in development mode)
exports.getDevCode = async (req, res) => {
    const isDev = process.env.NODE_ENV !== "production" || !process.env.EMAIL_PASS;
    if (!isDev) {
        return res.status(403).json({ message: "Not available in production" });
    }
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ devCode: user.verificationCode || null, emailVerified: user.emailVerified });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
