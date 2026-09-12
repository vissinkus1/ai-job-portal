const Report = require("../models/Report");
const Job = require("../models/Job");

// POST /api/reports/:jobId — Submit a report
exports.submitReport = async (req, res) => {
    const { reason, details } = req.body;

    if (!["spam", "misleading", "inappropriate", "other"].includes(reason)) {
        return res.status(400).json({ message: "Invalid reason. Must be: spam, misleading, inappropriate, or other" });
    }

    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        // Don't allow reporting your own job
        if (job.postedBy.toString() === req.user.id) {
            return res.status(400).json({ message: "You cannot report your own job" });
        }

        // Check for duplicate report
        const existing = await Report.findOne({
            reporter: req.user.id,
            job: req.params.jobId,
        });
        if (existing) {
            return res.status(400).json({ message: "You have already reported this job" });
        }

        const report = new Report({
            reporter: req.user.id,
            job: req.params.jobId,
            reason,
            details: details || "",
        });

        await report.save();
        res.status(201).json({ message: "Report submitted. Thank you for helping keep the platform safe.", report });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/reports — List all reports (admin only)
exports.getReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const statusFilter = req.query.status || "";

        const filter = {};
        if (statusFilter) filter.status = statusFilter;

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate("reporter", "name email")
                .populate({
                    path: "job",
                    select: "title company postedBy",
                    populate: { path: "postedBy", select: "name email" },
                })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Report.countDocuments(filter),
        ]);

        res.json({
            reports,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/reports/:id — Update report status (admin only)
exports.updateReport = async (req, res) => {
    const { status, adminNote } = req.body;

    if (!["reviewed", "dismissed"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'reviewed' or 'dismissed'" });
    }

    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report not found" });

        report.status = status;
        if (adminNote !== undefined) report.adminNote = adminNote;
        await report.save();

        res.json({ message: `Report ${status}`, report });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/admin/reports/:id/remove-job — Remove the reported job (admin only)
exports.removeReportedJob = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report not found" });

        // Delete the job
        const deletedJob = await Job.findByIdAndDelete(report.job);
        if (!deletedJob) {
            return res.status(404).json({ message: "Job already removed" });
        }

        // Mark report and all other reports for this job as reviewed
        await Report.updateMany(
            { job: report.job },
            { status: "reviewed", adminNote: "Job removed by admin" }
        );

        res.json({ message: "Job removed and reports resolved" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
