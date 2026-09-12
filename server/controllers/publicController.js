const Job = require("../models/Job");

// GET /api/public/similar/:jobId — Similar jobs by skill overlap
exports.getSimilarJobs = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        const similar = await Job.find({
            _id: { $ne: job._id },
            skills: { $in: job.skills || [] },
            $or: [
                { deadline: { $exists: false } },
                { deadline: null },
                { deadline: { $gte: new Date() } },
            ],
        })
            .populate("postedBy", "name")
            .sort({ createdAt: -1 })
            .limit(4);

        res.json(similar);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/public/featured — Latest 3 active jobs
exports.getFeaturedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            $or: [
                { deadline: { $exists: false } },
                { deadline: null },
                { deadline: { $gte: new Date() } },
            ],
        })
            .populate("postedBy", "name")
            .sort({ createdAt: -1 })
            .limit(3);

        res.json(jobs);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
