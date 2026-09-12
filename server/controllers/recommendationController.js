const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const { scoreJobsWithTFIDF, normalizeSkill, collaborativeFilter } = require("../utils/TFIDFEngine");

// Scoring weights (total = 100)
const WEIGHTS = {
    skillMatch: 30,
    tfidfSimilarity: 15,
    experienceFit: 15,
    locationFit: 12,
    recency: 8,
    engagement: 12,
    collaborative: 8,
};

// GET /api/recommendations — AI multi-factor job matching with TF-IDF
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

        // Build skill regex patterns for fuzzy matching (with synonym expansion)
        const expandedSkills = [...new Set(userSkills.map(s => normalizeSkill(s)))];
        const skillRegexes = expandedSkills.map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

        // Only fetch active, non-expired jobs with at least one matching skill
        const filter = {
            skills: { $elemMatch: { $in: skillRegexes } },
            $or: [
                { deadline: { $exists: false } },
                { deadline: null },
                { deadline: { $gte: new Date() } },
            ],
        };

        const jobs = await Job.find(filter)
            .populate("postedBy", "name email")
            .limit(200);

        // Also fetch some jobs without direct skill match for collaborative filtering discovery
        const additionalJobs = await Job.find({
            _id: { $nin: jobs.map(j => j._id) },
            $or: [
                { deadline: { $exists: false } },
                { deadline: null },
                { deadline: { $gte: new Date() } },
            ],
        })
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 })
            .limit(50);

        const allCandidateJobs = [...jobs, ...additionalJobs];

        // Get user's past applications for engagement scoring
        const userApplications = await Application.find({ applicant: req.user.id })
            .select("job")
            .lean();
        const appliedJobIds = new Set(userApplications.map((a) => a.job.toString()));

        // Get companies user has applied to before
        const appliedJobs = await Job.find({
            _id: { $in: userApplications.map((a) => a.job) },
        }).select("company");
        const appliedCompanies = new Set(appliedJobs.map((j) => j.company.toLowerCase()));

        // ─── TF-IDF Scoring ──────────────────────────────────────
        const tfidfScores = {};
        try {
            const tfidfResults = scoreJobsWithTFIDF(user, allCandidateJobs);
            for (const result of tfidfResults) {
                tfidfScores[result.job._id.toString()] = result.tfidfScore;
            }
        } catch (err) {
            console.error("[TF-IDF] Scoring error:", err.message);
            // Fallback: TF-IDF scores remain empty, won't affect other factors
        }

        // ─── Collaborative Filtering ─────────────────────────────
        const collaborativeScores = {};
        try {
            const allApplications = await Application.find({}).select("applicant job").lean();
            const allUsers = await User.find({ skills: { $exists: true, $not: { $size: 0 } } })
                .select("skills")
                .lean();

            const cfResults = collaborativeFilter(req.user.id, allApplications, allUsers);
            for (const result of cfResults) {
                collaborativeScores[result.jobId] = result.collaborativeScore;
            }
        } catch (err) {
            console.error("[Collaborative Filter] Error:", err.message);
        }

        // User preferences
        const prefLocations = (user.preferences?.locations || []).map((l) => l.toLowerCase());
        const prefTypes = user.preferences?.jobTypes || [];
        const remotePref = user.preferences?.remotePreference || "any";
        const userExpYears = user.parsedResume?.experienceYears;

        // Map experience years to level
        const getExpLevel = (years) => {
            if (years === null || years === undefined) return null;
            if (years <= 1) return "Entry";
            if (years <= 4) return "Mid";
            if (years <= 8) return "Senior";
            return "Lead";
        };
        const userExpLevel = getExpLevel(userExpYears);

        // Experience level order for distance calculation
        const expOrder = { Entry: 0, Mid: 1, Senior: 2, Lead: 3 };

        const now = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        // Score each job
        const scored = allCandidateJobs.map((job) => {
            const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim());
            const normalizedJobSkills = jobSkills.map(s => normalizeSkill(s));
            const breakdown = {};

            // --- 1. Skill Match Score (0-100) --- (with synonym-aware matching)
            const matchedSkills = expandedSkills.filter((us) =>
                normalizedJobSkills.some((js) => js.includes(us) || us.includes(js))
            );
            const missingSkills = jobSkills.filter(
                (js) => !expandedSkills.some((us) => {
                    const normalizedJs = normalizeSkill(js);
                    return normalizedJs.includes(us) || us.includes(normalizedJs);
                })
            );
            const skillScore = jobSkills.length > 0
                ? Math.round((matchedSkills.length / jobSkills.length) * 100)
                : 0;
            breakdown.skillMatch = Math.min(skillScore, 100);

            // --- 2. TF-IDF Similarity Score (0-100) ---
            breakdown.tfidfSimilarity = tfidfScores[job._id.toString()] || 0;

            // --- 3. Experience Fit Score (0-100) ---
            let expScore = 50; // Default neutral
            if (userExpLevel && job.experienceLevel) {
                const userLev = expOrder[userExpLevel] ?? 1;
                const jobLev = expOrder[job.experienceLevel] ?? 1;
                const distance = Math.abs(userLev - jobLev);
                expScore = distance === 0 ? 100 : distance === 1 ? 70 : distance === 2 ? 30 : 10;
            }
            breakdown.experienceFit = expScore;

            // --- 4. Location Fit Score (0-100) ---
            let locScore = 50; // Default neutral
            const jobLoc = (job.location || "").toLowerCase();
            const isRemote = jobLoc.includes("remote") || job.type === "Remote";

            if (remotePref === "remote-only") {
                locScore = isRemote ? 100 : 10;
            } else if (remotePref === "on-site-only") {
                locScore = isRemote ? 10 : 70;
            } else {
                if (isRemote) locScore = 80;
            }

            if (prefLocations.length > 0 && !isRemote) {
                const locMatch = prefLocations.some((pl) => jobLoc.includes(pl));
                locScore = locMatch ? 100 : 20;
            }
            breakdown.locationFit = locScore;

            // --- 5. Recency Score (0-100) ---
            const ageMs = now - new Date(job.createdAt);
            const recencyScore = Math.max(0, Math.round((1 - ageMs / (thirtyDaysMs * 3)) * 100));
            breakdown.recency = Math.min(recencyScore, 100);

            // --- 6. Engagement Score (0-100) ---
            let engageScore = 30; // Base
            if (appliedCompanies.has((job.company || "").toLowerCase())) {
                engageScore += 50; // User has applied to this company before
            }
            if (prefTypes.length > 0 && prefTypes.includes(job.type)) {
                engageScore += 20; // Matches preferred job type
            }
            // Don't recommend already-applied jobs highly
            if (appliedJobIds.has(job._id.toString())) {
                engageScore = 0;
            }
            breakdown.engagement = Math.min(engageScore, 100);

            // --- 7. Collaborative Score (0-100) ---
            breakdown.collaborative = Math.min(collaborativeScores[job._id.toString()] || 0, 100);

            // --- Weighted Total ---
            const totalScore = Math.round(
                (breakdown.skillMatch * WEIGHTS.skillMatch +
                    breakdown.tfidfSimilarity * WEIGHTS.tfidfSimilarity +
                    breakdown.experienceFit * WEIGHTS.experienceFit +
                    breakdown.locationFit * WEIGHTS.locationFit +
                    breakdown.recency * WEIGHTS.recency +
                    breakdown.engagement * WEIGHTS.engagement +
                    breakdown.collaborative * WEIGHTS.collaborative) / 100
            );

            // Map matched skills back to original casing
            const displayMatchedSkills = matchedSkills.map((s) => {
                const original = (user.skills || []).find(us => us.toLowerCase().trim() === s || normalizeSkill(us.toLowerCase().trim()) === s);
                return original || (s.charAt(0).toUpperCase() + s.slice(1));
            });

            return {
                job: job.toObject(),
                matchScore: Math.min(totalScore, 100),
                breakdown,
                matchedSkills: displayMatchedSkills,
                missingSkills: missingSkills.map((s) =>
                    s.charAt(0).toUpperCase() + s.slice(1)
                ),
                totalJobSkills: jobSkills.length,
                alreadyApplied: appliedJobIds.has(job._id.toString()),
                hasCollaborativeSignal: (collaborativeScores[job._id.toString()] || 0) > 0,
            };
        });

        // Sort by score descending, limit to top 50
        const recommendations = scored
            .filter((s) => s.matchScore > 0 && !s.alreadyApplied)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 50);

        res.json({
            recommendations,
            userSkills: user.skills,
            weights: WEIGHTS,
            algorithmVersion: "2.0-tfidf",
            message: `Found ${recommendations.length} matching jobs using ${Object.keys(WEIGHTS).length}-factor AI analysis with TF-IDF + collaborative filtering`,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
