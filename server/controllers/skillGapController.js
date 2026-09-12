const Job = require("../models/Job");
const User = require("../models/User");
const {
    analyzeSkillGaps,
    detectBestRoles,
    getTrendingPaths,
    getAvailableRoles,
} = require("../utils/SkillGapEngine");

// GET /api/skill-gap/analysis — Full skill gap analysis with learning paths
exports.getSkillGapAnalysis = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const userSkills = user.skills || [];
        if (userSkills.length === 0) {
            return res.json({
                message: "Add skills to your profile to get AI-powered skill gap analysis",
                readinessScore: 0,
                ownedSkills: [],
                gapSkills: [],
                learningPaths: [],
                roleMatches: [],
            });
        }

        // Fetch recent jobs (last 90 days) for market analysis
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const marketJobs = await Job.find({
            createdAt: { $gte: ninetyDaysAgo },
            skills: { $exists: true, $not: { $size: 0 } },
        }).select("skills title company type experienceLevel location").lean();

        // Target role from query param (optional)
        const targetRole = req.query.role || null;

        const analysis = analyzeSkillGaps(userSkills, marketJobs, { targetRole });

        res.json({
            ...analysis,
            message: `Analyzed ${marketJobs.length} recent jobs across ${analysis.totalUniqueSkillsInMarket} unique skills`,
        });
    } catch (error) {
        console.error("[Skill Gap Analysis]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/skill-gap/readiness-score — Quick market readiness score
exports.getReadinessScore = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("skills");
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.skills?.length) {
            return res.json({ readinessScore: 0, message: "Add skills first" });
        }

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const marketJobs = await Job.find({
            createdAt: { $gte: ninetyDaysAgo },
            skills: { $exists: true, $not: { $size: 0 } },
        }).select("skills").lean();

        const analysis = analyzeSkillGaps(user.skills, marketJobs);

        res.json({
            readinessScore: analysis.readinessScore,
            roleMatches: analysis.roleMatches.slice(0, 3),
            topGaps: analysis.gapSkills.slice(0, 5),
        });
    } catch (error) {
        console.error("[Readiness Score]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/skill-gap/trending-paths — Popular skill progression paths
exports.getTrendingPaths = async (req, res) => {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const jobs = await Job.find({
            createdAt: { $gte: ninetyDaysAgo },
            skills: { $exists: true, $not: { $size: 0 } },
        }).select("skills").lean();

        const trending = getTrendingPaths(jobs);

        res.json({
            ...trending,
            totalJobsAnalyzed: jobs.length,
        });
    } catch (error) {
        console.error("[Trending Paths]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/skill-gap/roles — Available target roles
exports.getAvailableRoles = async (req, res) => {
    try {
        res.json({ roles: getAvailableRoles() });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
