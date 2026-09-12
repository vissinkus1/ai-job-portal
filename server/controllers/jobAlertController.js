const JobAlert = require("../models/JobAlert");
const Job = require("../models/Job");
const User = require("../models/User");
const { createNotification } = require("./notificationController");
const { sendJobAlertEmail } = require("../utils/emailService");

const MAX_ALERTS_PER_USER = 5;

// POST /api/job-alerts — Create a new alert
exports.createAlert = async (req, res) => {
    try {
        const count = await JobAlert.countDocuments({ user: req.user.id });
        if (count >= MAX_ALERTS_PER_USER) {
            return res.status(400).json({
                message: `You can have up to ${MAX_ALERTS_PER_USER} alerts. Delete one to create a new one.`,
            });
        }

        const { name, keywords, skills, locations, jobTypes, experienceLevels, emailNotify } = req.body;

        const alert = new JobAlert({
            user: req.user.id,
            name: name || "My Alert",
            keywords: keywords || [],
            skills: skills || [],
            locations: locations || [],
            jobTypes: jobTypes || [],
            experienceLevels: experienceLevels || [],
            emailNotify: emailNotify !== false,
        });

        await alert.save();
        res.status(201).json({ message: "Alert created", alert });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/job-alerts — Get my alerts
exports.getMyAlerts = async (req, res) => {
    try {
        const alerts = await JobAlert.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/job-alerts/:id — Update an alert
exports.updateAlert = async (req, res) => {
    try {
        const alert = await JobAlert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: "Alert not found" });
        if (alert.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const fields = ["name", "keywords", "skills", "locations", "jobTypes", "experienceLevels", "emailNotify", "isActive"];
        for (const field of fields) {
            if (req.body[field] !== undefined) alert[field] = req.body[field];
        }

        await alert.save();
        res.json({ message: "Alert updated", alert });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/job-alerts/:id — Delete an alert
exports.deleteAlert = async (req, res) => {
    try {
        const alert = await JobAlert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: "Alert not found" });
        if (alert.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await JobAlert.findByIdAndDelete(req.params.id);
        res.json({ message: "Alert deleted" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/job-alerts/:id/preview — Preview matching jobs for an alert
exports.previewAlert = async (req, res) => {
    try {
        const alert = await JobAlert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: "Alert not found" });
        if (alert.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const matchingJobs = await findMatchingJobs(alert);
        res.json({ count: matchingJobs.length, jobs: matchingJobs.slice(0, 10) });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Check all active alerts against a newly posted job and send notifications.
 * Called from jobController.createJob.
 */
exports.checkAndNotify = async (job, io) => {
    try {
        const activeAlerts = await JobAlert.find({ isActive: true });

        for (const alert of activeAlerts) {
            // Don't notify the employer who posted the job
            if (alert.user.toString() === job.postedBy.toString()) continue;

            if (doesJobMatchAlert(job, alert)) {
                alert.matchCount += 1;
                alert.lastNotified = new Date();
                await alert.save();

                // In-app notification
                createNotification({
                    user: alert.user,
                    type: "system",
                    title: "🔔 Job Alert Match!",
                    message: `New job matching your "${alert.name}" alert: ${job.title} at ${job.company}`,
                    link: `/jobs/${job._id}`,
                    io,
                });

                // Email notification (if enabled)
                if (alert.emailNotify) {
                    const user = await User.findById(alert.user).select("email name");
                    if (user) {
                        sendJobAlertEmail(user.email, user.name, [
                            { title: job.title, company: job.company, location: job.location, id: job._id },
                        ]);
                    }
                }
            }
        }
    } catch (error) {
        console.error("[Job Alerts] Error checking alerts:", error.message);
    }
};

/**
 * Check if a job matches an alert's criteria.
 */
function doesJobMatchAlert(job, alert) {
    let matched = false;

    // Keyword match (title or company)
    if (alert.keywords?.length > 0) {
        const keywordMatch = alert.keywords.some((kw) => {
            const regex = new RegExp(kw, "i");
            return regex.test(job.title) || regex.test(job.company) || regex.test(job.description || "");
        });
        if (keywordMatch) matched = true;
        else return false; // Keywords are required if specified
    }

    // Skill match
    if (alert.skills?.length > 0) {
        const jobSkillsLower = (job.skills || []).map((s) => s.toLowerCase());
        const skillMatch = alert.skills.some((s) =>
            jobSkillsLower.some((js) => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js))
        );
        if (skillMatch) matched = true;
        else if (!matched) return false;
    }

    // Location match
    if (alert.locations?.length > 0) {
        const locMatch = alert.locations.some((loc) =>
            new RegExp(loc, "i").test(job.location)
        );
        if (locMatch) matched = true;
        else if (!matched) return false;
    }

    // Job type match
    if (alert.jobTypes?.length > 0) {
        if (alert.jobTypes.includes(job.type)) matched = true;
        else if (!matched) return false;
    }

    // Experience level match
    if (alert.experienceLevels?.length > 0) {
        if (alert.experienceLevels.includes(job.experienceLevel)) matched = true;
        else if (!matched) return false;
    }

    // If no criteria set, don't match anything
    if (!alert.keywords?.length && !alert.skills?.length && !alert.locations?.length &&
        !alert.jobTypes?.length && !alert.experienceLevels?.length) {
        return false;
    }

    return matched;
}

/**
 * Find existing jobs matching an alert (for preview).
 */
async function findMatchingJobs(alert) {
    const filter = {
        $and: [
            {
                $or: [
                    { deadline: { $exists: false } },
                    { deadline: null },
                    { deadline: { $gte: new Date() } },
                ],
            },
        ],
    };

    if (alert.keywords?.length > 0) {
        const kwRegexes = alert.keywords.map((kw) => new RegExp(kw, "i"));
        filter.$and.push({
            $or: [
                { title: { $in: kwRegexes } },
                { company: { $in: kwRegexes } },
            ],
        });
    }

    if (alert.locations?.length > 0) {
        filter.$and.push({
            location: { $in: alert.locations.map((l) => new RegExp(l, "i")) },
        });
    }

    if (alert.jobTypes?.length > 0) {
        filter.$and.push({ type: { $in: alert.jobTypes } });
    }

    if (alert.experienceLevels?.length > 0) {
        filter.$and.push({ experienceLevel: { $in: alert.experienceLevels } });
    }

    const jobs = await Job.find(filter)
        .select("title company location type experienceLevel salary createdAt")
        .sort({ createdAt: -1 })
        .limit(20);

    // Post-filter by skills if specified
    if (alert.skills?.length > 0) {
        return jobs; // Skip skill filter for preview simplicity
    }

    return jobs;
}
