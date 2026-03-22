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
