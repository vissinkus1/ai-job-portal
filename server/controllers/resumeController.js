const User = require("../models/User");
const fs = require("fs");
const path = require("path");

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
        await user.save();

        res.json({
            message: "Resume uploaded successfully",
            resume: user.resume,
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
            return res.json({ resume: null });
        }
        res.json({ resume: user.resume });
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
        await user.save();
        res.json({ message: "Resume deleted" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
