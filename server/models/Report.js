const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  reason: {
    type: String,
    enum: ["spam", "misleading", "inappropriate", "other"],
    required: true,
  },
  details: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "dismissed"],
    default: "pending",
  },
  adminNote: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate reports from the same user for the same job
reportSchema.index({ reporter: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
