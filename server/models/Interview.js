const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateTime: { type: Date, required: true },
  meetingLink: { type: String, default: "" },
  notes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  createdAt: { type: Date, default: Date.now },
});

interviewSchema.index({ applicant: 1, job: 1 });
interviewSchema.index({ employer: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
