const Interview = require("../models/Interview");
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// POST /api/interviews — Schedule interview (employer)
exports.scheduleInterview = async (req, res) => {
    const { applicationId, dateTime, meetingLink, notes } = req.body;

    try {
        const application = await Application.findById(applicationId).populate("job");
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Verify employer owns this job
        if (application.job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Check for existing scheduled interview
        const existing = await Interview.findOne({
            application: applicationId,
            status: "scheduled",
        });
        if (existing) {
            return res.status(400).json({ message: "An interview is already scheduled for this applicant" });
        }

        const interview = new Interview({
            application: applicationId,
            job: application.job._id,
            applicant: application.applicant,
            employer: req.user.id,
            dateTime,
            meetingLink: meetingLink || "",
            notes: notes || "",
        });

        await interview.save();

        // Notify applicant
        createNotification({
            user: application.applicant,
            type: "system",
            title: "Interview Scheduled! 🎉",
            message: `You have an interview for "${application.job.title}" on ${new Date(dateTime).toLocaleString()}`,
            link: "/my-applications",
            io: req.app.get("io"),
        });

        res.status(201).json({ message: "Interview scheduled", interview });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/interviews/job/:jobId — Interviews for a job (employer)
exports.getInterviewsForJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const interviews = await Interview.find({ job: req.params.jobId })
            .populate("applicant", "name email")
            .populate("job", "title company")
            .sort({ dateTime: 1 });

        res.json(interviews);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/interviews/me — My interviews (seeker)
exports.getMyInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({ applicant: req.user.id })
            .populate("job", "title company location")
            .populate("employer", "name email")
            .sort({ dateTime: 1 });

        res.json(interviews);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/interviews/:id — Update interview (employer: reschedule, cancel, complete)
exports.updateInterview = async (req, res) => {
    const { dateTime, meetingLink, notes, status } = req.body;

    try {
        const interview = await Interview.findById(req.params.id).populate("job");
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        if (interview.employer.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        if (dateTime !== undefined) interview.dateTime = dateTime;
        if (meetingLink !== undefined) interview.meetingLink = meetingLink;
        if (notes !== undefined) interview.notes = notes;
        if (status !== undefined && ["scheduled", "completed", "cancelled"].includes(status)) {
            interview.status = status;
        }

        await interview.save();

        // Notify applicant about changes
        const statusMsg = status === "cancelled"
            ? `Your interview for "${interview.job.title}" has been cancelled`
            : `Your interview for "${interview.job.title}" has been updated`;

        createNotification({
            user: interview.applicant,
            type: "system",
            title: status === "cancelled" ? "Interview Cancelled" : "Interview Updated",
            message: statusMsg,
            link: "/my-applications",
            io: req.app.get("io"),
        });

        res.json({ message: "Interview updated", interview });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
