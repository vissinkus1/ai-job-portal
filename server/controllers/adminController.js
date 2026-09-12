const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");

// GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalJobs, totalApps, employers, seekers] = await Promise.all([
            User.countDocuments(),
            Job.countDocuments(),
            Application.countDocuments(),
            User.countDocuments({ role: "employer" }),
            User.countDocuments({ role: "seeker" }),
        ]);

        const recentUsers = await User.find()
            .select("name email role createdAt")
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            totalUsers,
            totalJobs,
            totalApps,
            employers,
            seekers,
            recentUsers,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/charts
exports.getCharts = async (req, res) => {
    try {
        // Applications per day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const appsPerDay = await Application.aggregate([
            { $match: { appliedAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Jobs per type
        const jobsByType = await Job.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Top companies by job count
        const topCompanies = await Job.aggregate([
            { $group: { _id: "$company", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        // Application statuses
        const statusBreakdown = await Application.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        res.json({ appsPerDay, jobsByType, topCompanies, statusBreakdown });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/users — Paginated user list with search
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || "";

        const filter = {};
        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [{ name: regex }, { email: regex }];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("name email role isAdmin isBanned createdAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/users/:id/role — Toggle admin status
exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Prevent self-demotion
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: "You cannot change your own admin status" });
        }

        user.isAdmin = !user.isAdmin;
        await user.save();

        res.json({
            message: user.isAdmin ? "User promoted to admin" : "Admin privileges removed",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                isBanned: user.isBanned,
            },
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/users/:id/ban — Toggle ban status
exports.toggleBan = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Prevent self-ban
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: "You cannot ban yourself" });
        }

        // Don't allow banning other admins
        if (user.isAdmin) {
            return res.status(400).json({ message: "Cannot ban an admin user. Remove admin status first." });
        }

        user.isBanned = !user.isBanned;
        await user.save();

        res.json({
            message: user.isBanned ? "User banned" : "User unbanned",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                isBanned: user.isBanned,
            },
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
