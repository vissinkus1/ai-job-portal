const Job = require("../models/Job");
const User = require("../models/User");

// GET /api/recommendations — AI skill-based job matching
exports.getRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userSkills = (user.skills || []).map((s) => s.toLowerCase().trim());

        if (userSkills.length === 0) {
            return res.json({
                recommendations: [],
                message: "Add skills to your profile to get AI-powered recommendations",
            });
        }

        const jobs = await Job.find().populate("postedBy", "name email");

        // Score each job by skill match percentage
        const scored = jobs.map((job) => {
            const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim());
            const matchedSkills = userSkills.filter((us) =>
                jobSkills.some((js) => js.includes(us) || us.includes(js))
            );
            const matchScore =
                jobSkills.length > 0
                    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
                    : 0;

            return {
                job: job.toObject(),
                matchScore,
                matchedSkills: matchedSkills.map((s) =>
                    s.charAt(0).toUpperCase() + s.slice(1)
                ),
                totalJobSkills: jobSkills.length,
            };
        });

        // Filter jobs with at least 1 match, sort by score descending
        const recommendations = scored
            .filter((s) => s.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);

        res.json({
            recommendations,
            userSkills: user.skills,
            message: `Found ${recommendations.length} matching jobs based on your ${userSkills.length} skills`,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
