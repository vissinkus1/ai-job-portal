const User = require("../models/User");
const Application = require("../models/Application");
const fs = require("fs");
const path = require("path");
const { scoreResume, benchmarkResume } = require("../utils/ResumeScorer");

// GET /api/resume/score — Full resume analysis with section-by-section breakdown
exports.getResumeScore = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.resume?.filename) {
            return res.status(400).json({
                message: "Upload a resume first to get your AI-powered resume analysis",
            });
        }

        // Read the resume file
        const filePath = path.join(__dirname, "..", "uploads", user.resume.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ message: "Resume file not found. Please re-upload." });
        }

        // Parse resume text
        const ext = path.extname(filePath).toLowerCase();
        let text = "";

        if (ext === ".pdf") {
            const pdfParse = require("pdf-parse");
            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);
            text = data.text;
        } else if (ext === ".txt") {
            text = fs.readFileSync(filePath, "utf-8");
        } else {
            try {
                text = fs.readFileSync(filePath, "utf-8");
            } catch {
                return res.status(400).json({ message: "Unable to parse this file format. Use PDF or TXT." });
            }
        }

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                message: "Could not extract enough text from your resume. Try uploading a text-based PDF.",
            });
        }

        // Score the resume
        const meta = { fileFormat: ext };
        const result = scoreResume(text, meta);

        res.json({
            ...result,
            resumeFile: user.resume.originalName,
            analyzedAt: new Date(),
        });
    } catch (error) {
        console.error("[Resume Score]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/resume/ats-check — ATS compatibility check only
exports.getATSCheck = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.resume?.filename) {
            return res.status(400).json({ message: "Upload a resume first" });
        }

        const filePath = path.join(__dirname, "..", "uploads", user.resume.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ message: "Resume file not found" });
        }

        const ext = path.extname(filePath).toLowerCase();
        let text = "";

        if (ext === ".pdf") {
            const pdfParse = require("pdf-parse");
            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);
            text = data.text;
        } else {
            text = fs.readFileSync(filePath, "utf-8");
        }

        const meta = { fileFormat: ext };
        const result = scoreResume(text, meta);

        // Return only ATS-specific data
        res.json({
            atsScore: result.breakdown.atsCompatibility.score,
            checks: result.breakdown.atsCompatibility.results,
            skillCoverage: result.breakdown.skillCoverage,
            improvements: result.improvements.filter(i => i.category === "ats"),
        });
    } catch (error) {
        console.error("[ATS Check]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/resume/benchmark — Compare against applicant pool
exports.getBenchmark = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.resume?.filename) {
            return res.status(400).json({ message: "Upload a resume first" });
        }

        // Get the user's resume score
        const filePath = path.join(__dirname, "..", "uploads", user.resume.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ message: "Resume file not found" });
        }

        const ext = path.extname(filePath).toLowerCase();
        let text = "";

        if (ext === ".pdf") {
            const pdfParse = require("pdf-parse");
            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);
            text = data.text;
        } else {
            text = fs.readFileSync(filePath, "utf-8");
        }

        const userResult = scoreResume(text, { fileFormat: ext });

        // Get other users' parsed resume data for comparison
        // (We use skill counts and parsed data as proxy scores since we can't score all resumes)
        const otherUsers = await User.find({
            _id: { $ne: req.user.id },
            "parsedResume.extractedSkills": { $exists: true, $not: { $size: 0 } },
        }).select("parsedResume skills").lean();

        // Generate proxy scores based on profile completeness
        const proxyScores = otherUsers.map(u => {
            let score = 30; // Base
            const skillCount = (u.skills || []).length;
            const extractedCount = (u.parsedResume?.extractedSkills || []).length;
            const hasExperience = u.parsedResume?.experienceYears > 0;
            const hasEducation = (u.parsedResume?.education || []).length > 0;
            const hasSummary = (u.parsedResume?.summary || "").length > 50;

            score += Math.min(skillCount * 3, 25);
            score += Math.min(extractedCount * 2, 15);
            if (hasExperience) score += 10;
            if (hasEducation) score += 10;
            if (hasSummary) score += 10;

            return Math.min(score, 100);
        });

        const benchmark = benchmarkResume(userResult.overallScore, proxyScores);

        res.json({
            userScore: userResult.overallScore,
            userGrade: userResult.grade,
            ...benchmark,
        });
    } catch (error) {
        console.error("[Resume Benchmark]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
