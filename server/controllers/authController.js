const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../utils/emailService");

// Register User
exports.registerUser = async (req, res) => {
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

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword,
        });

        await user.save();
        
        // Send welcome email asynchronously
        sendWelcomeEmail(user.email, user.name);

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create and return JWT
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
            (err, token) => {
                if (err) throw err;
                res.json({ token, message: "Login successful" });
            }
        );
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

        res.json({ message: "Password updated successfully" });
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
