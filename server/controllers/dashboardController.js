const Job = require("../models/Job");
const Application = require("../models/Application");
const Interview = require("../models/Interview");

// GET /api/dashboard/employer-stats — Employer analytics
exports.getEmployerStats = async (req, res) => {
    try {
        // Get all jobs by this employer
        const myJobs = await Job.find({ postedBy: req.user.id }).select("_id title");
        const jobIds = myJobs.map((j) => j._id);

        // Get all applications for employer's jobs
        const applications = await Application.find({ job: { $in: jobIds } });

        // Status breakdown
        const statusCounts = { pending: 0, reviewed: 0, accepted: 0, rejected: 0 };
        applications.forEach((app) => {
            if (statusCounts[app.status] !== undefined) statusCounts[app.status]++;
        });

        // Interview count
        const interviewCount = await Interview.countDocuments({ employer: req.user.id });

        // Acceptance rate
        const totalDecided = statusCounts.accepted + statusCounts.rejected;
        const acceptanceRate = totalDecided > 0
            ? Math.round((statusCounts.accepted / totalDecided) * 100)
            : 0;

        // Per-job stats (top 5 by applicants)
        const perJobStats = [];
        for (const job of myJobs) {
            const count = applications.filter((a) => a.job.toString() === job._id.toString()).length;
            perJobStats.push({ jobId: job._id, title: job.title, applicants: count });
        }
        perJobStats.sort((a, b) => b.applicants - a.applicants);

        res.json({
            totalApplicants: applications.length,
            statusCounts,
            interviewCount,
            acceptanceRate,
            topJobs: perJobStats.slice(0, 5),
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/dashboard/job-app-counts — Batch applicant counts for employer's jobs
exports.getJobAppCounts = async (req, res) => {
    try {
        const myJobs = await Job.find({ postedBy: req.user.id }).select("_id");
        const jobIds = myJobs.map((j) => j._id);

        const counts = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: "$job", count: { $sum: 1 } } },
        ]);

        // Convert to { jobId: count } map
        const result = {};
        for (const c of counts) {
            result[c._id.toString()] = c.count;
        }

        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/dashboard/seeker-stats — Seeker analytics
exports.getSeekerStats = async (req, res) => {
    try {
        const applications = await Application.find({ applicant: req.user.id }).sort({ appliedAt: -1 });

        const total = applications.length;
        const responded = applications.filter((a) => a.status !== "pending").length;
        const accepted = applications.filter((a) => a.status === "accepted").length;
        const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

        // Weekly application count (last 4 weeks)
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - i * 7);

            const count = applications.filter((a) => {
                const d = new Date(a.appliedAt);
                return d >= weekStart && d < weekEnd;
            }).length;

            weeks.push({
                label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                count,
            });
        }

        res.json({
            totalApplications: total,
            responseRate,
            accepted,
            responded,
            weeklyData: weeks,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
