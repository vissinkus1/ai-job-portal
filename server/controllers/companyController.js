const User = require("../models/User");
const Job = require("../models/Job");

// GET /api/company/:userId — Public employer profile
exports.getCompanyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("name email bio role createdAt");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const jobs = await Job.find({ postedBy: req.params.userId })
            .sort({ createdAt: -1 })
            .select("title company location type salary skills createdAt");

        res.json({
            employer: user,
            jobs,
            totalJobs: jobs.length,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
