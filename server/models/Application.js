const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coverLetter: { type: String, default: "" },
  employerNotes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "reviewed", "accepted", "rejected"],
    default: "pending",
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      note: { type: String, default: "" },
    },
  ],
  appliedAt: { type: Date, default: Date.now },
});

// Prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Track status changes in history
applicationSchema.pre("save", function () {
  if (this.isNew) {
    // Initial application
    this.statusHistory = [
      { status: "pending", changedAt: this.appliedAt || new Date(), note: "Application submitted" },
    ];
  } else if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      note: "",
    });
  }
});

module.exports = mongoose.models.Application || mongoose.model("Application", applicationSchema);
