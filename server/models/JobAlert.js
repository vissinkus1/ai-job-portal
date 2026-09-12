const mongoose = require("mongoose");

const jobAlertSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, default: "My Alert" },
    keywords: [{ type: String }],
    skills: [{ type: String }],
    locations: [{ type: String }],
    jobTypes: [{ type: String }],
    experienceLevels: [{ type: String }],
    emailNotify: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    lastNotified: { type: Date },
    matchCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

jobAlertSchema.index({ user: 1 });
jobAlertSchema.index({ isActive: 1 });

module.exports = mongoose.model("JobAlert", jobAlertSchema);
