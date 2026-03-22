const User = require("../models/User");
const Job = require("../models/Job");

// POST /api/saved-jobs/:jobId — Toggle save/unsave
exports.toggleSaveJob = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const jobId = req.params.jobId;

        // Check job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const index = user.savedJobs.indexOf(jobId);
        if (index > -1) {
            // Unsave
            user.savedJobs.splice(index, 1);
            await user.save();
            res.json({ saved: false, message: "Job removed from saved" });
        } else {
            // Save
            user.savedJobs.push(jobId);
            await user.save();
            res.json({ saved: true, message: "Job saved" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/saved-jobs — List saved jobs
exports.getSavedJobs = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: "savedJobs",
            populate: { path: "postedBy", select: "name email" },
        });

        res.json(user.savedJobs || []);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/saved-jobs/check/:jobId — Check if job is saved
exports.checkSaved = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const saved = user.savedJobs.includes(req.params.jobId);
        res.json({ saved });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
