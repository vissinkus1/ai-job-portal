const User = require("../models/User");

// GET /api/profile/me — Fetch logged-in user's profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/profile/me — Update profile fields
exports.updateProfile = async (req, res) => {
    const { name, bio, skills, phone, role } = req.body;

    try {
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (bio !== undefined) updateFields.bio = bio;
        if (skills !== undefined) updateFields.skills = skills;
        if (phone !== undefined) updateFields.phone = phone;
        if (role !== undefined && ["seeker", "employer"].includes(role)) {
            updateFields.role = role;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
