const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");

// GET /api/analytics/skill-trends — Most in-demand skills across all jobs
exports.getSkillTrends = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const result = await Job.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $unwind: "$skills" },
            {
                $group: {
                    _id: { $toLower: "$skills" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 20 },
            {
                $project: {
                    skill: "$_id",
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        res.json({ skills: result, period: `${days} days` });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/analytics/salary-by-skill — Average salary ranges by skill
exports.getSalaryBySkill = async (req, res) => {
    try {
        const jobs = await Job.find({
            salary: { $exists: true, $ne: "Not disclosed", $ne: "" },
            skills: { $exists: true, $not: { $size: 0 } },
        }).select("skills salary");

        // Parse salary text to number
        const parseSalary = (text) => {
            if (!text || text === "Not disclosed") return null;
            const cleaned = text.replace(/[₹$,\s]/g, "");
            const match = cleaned.match(/([\d.]+)\s*(L|K|M)?/i);
            if (!match) return null;
            let num = parseFloat(match[1]);
            const unit = (match[2] || "").toUpperCase();
            if (unit === "L") num *= 100000;
            else if (unit === "K") num *= 1000;
            else if (unit === "M") num *= 1000000;
            return num;
        };

        // Aggregate salary data per skill
        const skillSalaries = {};
        for (const job of jobs) {
            const salary = parseSalary(job.salary);
            if (salary === null) continue;
            for (const skill of job.skills) {
                const key = skill.toLowerCase().trim();
                if (!skillSalaries[key]) {
                    skillSalaries[key] = { total: 0, count: 0, min: salary, max: salary };
                }
                skillSalaries[key].total += salary;
                skillSalaries[key].count += 1;
                skillSalaries[key].min = Math.min(skillSalaries[key].min, salary);
                skillSalaries[key].max = Math.max(skillSalaries[key].max, salary);
            }
        }

        // Format and sort by count
        const result = Object.entries(skillSalaries)
            .map(([skill, data]) => ({
                skill: skill.charAt(0).toUpperCase() + skill.slice(1),
                avgSalary: Math.round(data.total / data.count),
                minSalary: data.min,
                maxSalary: data.max,
                jobCount: data.count,
            }))
            .sort((a, b) => b.jobCount - a.jobCount)
            .slice(0, 15);

        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/analytics/demand-over-time — Job posting volume trends
exports.getDemandOverTime = async (req, res) => {
    try {
        const weeks = parseInt(req.query.weeks) || 8;
        const data = [];

        for (let i = weeks - 1; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - i * 7);

            const count = await Job.countDocuments({
                createdAt: { $gte: weekStart, $lt: weekEnd },
            });

            data.push({
                label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                jobs: count,
            });
        }

        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/analytics/top-companies-hiring — Most active employers
exports.getTopCompaniesHiring = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await Job.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: "$company", jobCount: { $sum: 1 } } },
            { $sort: { jobCount: -1 } },
            { $limit: 10 },
            { $project: { company: "$_id", jobCount: 1, _id: 0 } },
        ]);

        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/analytics/my-skill-market-value — How in-demand the user's skills are
exports.getMySkillMarketValue = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("skills");
        if (!user || !user.skills?.length) {
            return res.json({
                skills: [],
                message: "Add skills to your profile to see market insights",
            });
        }

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Total jobs in last 90 days for percentage calculation
        const totalJobs = await Job.countDocuments({ createdAt: { $gte: ninetyDaysAgo } });

        const skillData = [];
        for (const skill of user.skills) {
            const regex = new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            const demandCount = await Job.countDocuments({
                skills: { $in: [regex] },
                createdAt: { $gte: ninetyDaysAgo },
            });

            // Find applications count for jobs with this skill
            const relevantJobs = await Job.find({
                skills: { $in: [regex] },
                createdAt: { $gte: ninetyDaysAgo },
            }).select("_id");
            const jobIds = relevantJobs.map((j) => j._id);
            const competitionCount = await Application.countDocuments({
                job: { $in: jobIds },
            });

            skillData.push({
                skill,
                demand: demandCount,
                demandPercentage: totalJobs > 0 ? Math.round((demandCount / totalJobs) * 100) : 0,
                competition: competitionCount,
                avgApplicantsPerJob: demandCount > 0 ? Math.round(competitionCount / demandCount) : 0,
            });
        }

        // Sort by demand descending
        skillData.sort((a, b) => b.demand - a.demand);

        res.json({
            skills: skillData,
            totalJobsAnalyzed: totalJobs,
            period: "90 days",
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
