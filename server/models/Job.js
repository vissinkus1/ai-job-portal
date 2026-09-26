const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ["Full-time", "Part-time", "Remote", "Contract", "Internship"], default: "Full-time" },
  experienceLevel: { type: String, enum: ["Entry", "Mid", "Senior", "Lead"], default: "Entry" },
  description: { type: String, required: true },
  skills: [{ type: String }],
  salary: { type: String, default: "Not disclosed" },
  deadline: { type: Date },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  views: { type: Number, default: 0 },
  applicationCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Create text index for full-text search and relevance scoring
jobSchema.index(
  {
    title: "text",
    skills: "text",
    company: "text",
    description: "text",
  },
  {
    weights: {
      title: 10,
      skills: 5,
      company: 3,
      description: 1,
    },
    name: "JobTextIndex",
  }
);

module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
