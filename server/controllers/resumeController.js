const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const { parseResume } = require("../utils/resumeParser");

// POST /api/resume/upload
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const user = await User.findById(req.user.id);

        // Delete old resume file if exists
        if (user.resume && user.resume.filename) {
            const oldPath = path.join(__dirname, "../uploads", user.resume.filename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        user.resume = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedAt: new Date(),
        };

        // AI Resume Parsing — extract skills, experience, education
        let parsedData = null;
        try {
            const filePath = path.join(__dirname, "../uploads", req.file.filename);
            parsedData = await parseResume(filePath);

            user.parsedResume = {
                extractedSkills: parsedData.extractedSkills,
                experienceYears: parsedData.experienceYears,
                education: parsedData.education,
                summary: parsedData.summary,
                parsedAt: new Date(),
            };

            // Auto-merge extracted skills into user's skills (union, no duplicates)
            if (parsedData.extractedSkills.length > 0) {
                const existingLower = (user.skills || []).map((s) => s.toLowerCase());
                const newSkills = parsedData.extractedSkills.filter(
                    (s) => !existingLower.includes(s.toLowerCase())
                );
                if (newSkills.length > 0) {
                    user.skills = [...(user.skills || []), ...newSkills];
                }
            }
        } catch (parseErr) {
            console.error("[Resume Parser] Failed:", parseErr.message);
            // Non-fatal — still save the file even if parsing fails
        }

        await user.save();

        res.json({
            message: "Resume uploaded successfully",
            resume: user.resume,
            parsedResume: user.parsedResume || null,
            skillsAdded: parsedData?.extractedSkills?.length || 0,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/resume/me
exports.getResume = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.resume || !user.resume.filename) {
            return res.json({ resume: null, parsedResume: null });
        }
        res.json({ resume: user.resume, parsedResume: user.parsedResume || null });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/resume/me
exports.deleteResume = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.resume && user.resume.filename) {
            const filePath = path.join(__dirname, "../uploads", user.resume.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        user.resume = undefined;
        user.parsedResume = undefined;
        await user.save();
        res.json({ message: "Resume deleted" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
