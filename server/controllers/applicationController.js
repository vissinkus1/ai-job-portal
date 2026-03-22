const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// POST /api/applications/:jobId — Apply to a job
exports.applyToJob = async (req, res) => {
    const { coverLetter } = req.body;

    try {
        // Check if job exists
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check if already applied
        const existing = await Application.findOne({
            job: req.params.jobId,
            applicant: req.user.id,
        });
        if (existing) {
            return res.status(400).json({ message: "You have already applied to this job" });
        }

        const application = new Application({
            job: req.params.jobId,
            applicant: req.user.id,
            coverLetter: coverLetter || "",
        });

        await application.save();

        // Notify employer
        const applicant = await User.findById(req.user.id);
        createNotification({
            user: job.postedBy,
            type: "new_applicant",
            title: "New Application",
            message: `${applicant?.name || "Someone"} applied to your job: ${job.title}`,
            link: `/manage-jobs/${job._id}/applicants`,
        });

        res.status(201).json({ message: "Application submitted successfully", application });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/applications/me — My applications (seeker)
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ applicant: req.user.id })
            .populate({
                path: "job",
                populate: { path: "postedBy", select: "name email" },
            })
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/applications/job/:jobId — Applicants for a job (employer)
exports.getJobApplicants = async (req, res) => {
    try {
        // Verify the user owns this job
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        if (job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const applications = await Application.find({ job: req.params.jobId })
            .populate("applicant", "name email bio skills phone role")
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/applications/:id/status — Update application status (employer)
exports.updateApplicationStatus = async (req, res) => {
    const { status } = req.body;

    if (!["pending", "reviewed", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const application = await Application.findById(req.params.id).populate("job");
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Verify the user owns the job
        if (application.job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        application.status = status;
        await application.save();

        // Notify applicant
        const statusLabels = { reviewed: "reviewed", accepted: "accepted 🎉", rejected: "rejected" };
        createNotification({
            user: application.applicant,
            type: "application_status",
            title: `Application ${statusLabels[status] || status}`,
            message: `Your application for "${application.job.title}" has been ${statusLabels[status] || status}`,
            link: "/my-applications",
        });

        res.json({ message: "Status updated", application });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/applications/check/:jobId — Check if user applied to a job
exports.checkApplication = async (req, res) => {
    try {
        const application = await Application.findOne({
            job: req.params.jobId,
            applicant: req.user.id,
        });
        res.json({ applied: !!application, application });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/applications/job/:jobId/export — Export applicants as CSV
exports.exportApplicants = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const apps = await Application.find({ job: req.params.jobId })
            .populate("applicant", "name email skills phone")
            .sort({ appliedAt: -1 });

        let csv = "Name,Email,Phone,Skills,Cover Letter,Status,Applied Date\n";
        for (const app of apps) {
            const name = app.applicant?.name || "";
            const email = app.applicant?.email || "";
            const phone = app.applicant?.phone || "";
            const skills = (app.applicant?.skills || []).join("; ");
            const cover = (app.coverLetter || "").replace(/"/g, '""');
            const status = app.status;
            const date = new Date(app.appliedAt).toLocaleDateString();
            csv += `"${name}","${email}","${phone}","${skills}","${cover}","${status}","${date}"\n`;
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=applicants-${req.params.jobId}.csv`);
        res.send(csv);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
