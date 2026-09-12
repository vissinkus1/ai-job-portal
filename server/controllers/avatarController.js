const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// POST /api/profile/avatar — Upload profile picture
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Delete old avatar if exists
        if (user.profilePicture?.filename) {
            const oldPath = path.join(__dirname, "..", "uploads", user.profilePicture.filename);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        user.profilePicture = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedAt: new Date(),
        };
        await user.save();

        res.json({
            message: "Profile picture updated",
            profilePicture: user.profilePicture,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/profile/avatar — Remove profile picture
exports.deleteAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.profilePicture?.filename) {
            const filePath = path.join(__dirname, "..", "uploads", user.profilePicture.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        user.profilePicture = undefined;
        await user.save();

        res.json({ message: "Profile picture removed" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
