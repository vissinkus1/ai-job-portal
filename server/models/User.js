const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["seeker", "employer"], default: "seeker" },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpiry: { type: Date },
  bio: { type: String, default: "" },
  skills: [{ type: String }],
  phone: { type: String, default: "" },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  resume: {
    filename: String,
    originalName: String,
    uploadedAt: Date,
  },
  profilePicture: {
    filename: String,
    originalName: String,
    uploadedAt: Date,
  },
  parsedResume: {
    extractedSkills: [{ type: String }],
    experienceYears: { type: Number },
    education: [{ type: String }],
    summary: { type: String },
    parsedAt: { type: Date },
  },
  preferences: {
    locations: [{ type: String }],
    jobTypes: [{ type: String }],
    minSalary: { type: Number },
    remotePreference: {
      type: String,
      enum: ["any", "remote-only", "on-site-only"],
      default: "any",
    },
  },
  resetCode: String,
  resetCodeExpiry: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);



