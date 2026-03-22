const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["seeker", "employer"], default: "seeker" },
  bio: { type: String, default: "" },
  skills: [{ type: String }],
  phone: { type: String, default: "" },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  resume: {
    filename: String,
    originalName: String,
    uploadedAt: Date,
  },
  resetCode: String,
  resetCodeExpiry: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);



