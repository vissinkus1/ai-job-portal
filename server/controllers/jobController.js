const Job = require("../models/Job");
const { checkAndNotify } = require("./jobAlertController");

// GET /api/jobs — List jobs with server-side search, filter, and pagination
exports.getJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const sort = req.query.sort || "-createdAt";
        const { search, location, type, experienceLevel, salaryMin, salaryMax } = req.query;

        // Build filter
        const filter = {};
        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [
                { title: regex },
                { company: regex },
                { skills: { $in: [regex] } },
            ];
        }
        if (location) {
            filter.location = new RegExp(location, "i");
        }
        if (type) {
            filter.type = type;
        }
        if (experienceLevel) {
            filter.experienceLevel = experienceLevel;
        }

        // Hide expired jobs by default (unless employer passes includeExpired)
        if (req.query.includeExpired !== "true") {
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { deadline: { $exists: false } },
                    { deadline: null },
                    { deadline: { $gte: new Date() } },
                ],
            });
        }

        let query = Job.find(filter).populate("postedBy", "name email").sort(sort);

        // Helper to extract numeric salary value from text (e.g. "₹8L" -> 800000, "$50K" -> 50000)
        const parseSalaryText = (text) => {
            if (!text || text === "Not disclosed") return null;
            const cleaned = text.replace(/[₹$,\s]/g, "");
            const match = cleaned.match(/([\d.]+)\s*(L|K|M)?/i);
            if (!match) return null;
            let num = parseFloat(match[1]);
            const unit = (match[2] || "").toUpperCase();
            if (unit === "L") num *= 100000;
            else if (unit === "K") num *= 1000;
            else if (unit === "M") num *= 1000000;
            return num;
        };

        const hasSalaryFilter = salaryMin || salaryMax;

        if (limit > 0 && !hasSalaryFilter) {
            const total = await Job.countDocuments(filter);
            const totalPages = Math.ceil(total / limit);
            const jobs = await query.skip((page - 1) * limit).limit(limit);

            return res.json({
                jobs,
                currentPage: page,
                totalPages,
                total,
            });
        }

        // Fetch all matching jobs (for salary post-filter or no pagination)
        let jobs = await query;

        // Apply salary post-filter if requested
        if (hasSalaryFilter) {
            const min = salaryMin ? parseFloat(salaryMin) : 0;
            const max = salaryMax ? parseFloat(salaryMax) : Infinity;
            jobs = jobs.filter((job) => {
                const val = parseSalaryText(job.salary);
                if (val === null) return false; // "Not disclosed" excluded when filtering
                return val >= min && val <= max;
            });

            if (limit > 0) {
                const total = jobs.length;
                const totalPages = Math.ceil(total / limit);
                const paged = jobs.slice((page - 1) * limit, page * limit);
                return res.json({ jobs: paged, currentPage: page, totalPages, total });
            }
        }

        res.json(jobs);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/jobs/:id — Single job detail
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate("postedBy", "name email");
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        
        // Increment views
        job.views = (job.views || 0) + 1;
        await job.save({ validateModifiedOnly: true }); // Avoid full validation on view
        
        res.json(job);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/jobs — Create job (protected)
exports.createJob = async (req, res) => {
    const { title, company, location, type, experienceLevel, description, skills, salary, deadline } = req.body;

    // Validate required fields
    if (!title || !company || !location) {
        return res.status(400).json({ message: "Title, company, and location are required" });
    }
    if (title.length < 3 || title.length > 100) {
        return res.status(400).json({ message: "Title must be between 3 and 100 characters" });
    }
    if (description && description.replace(/<[^>]*>/g, "").length < 10) {
        return res.status(400).json({ message: "Description must be at least 10 characters" });
    }

    const validTypes = ["Full-time", "Part-time", "Remote", "Contract", "Internship"];
    if (type && !validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid job type" });
    }

    const validLevels = ["Entry", "Mid", "Senior", "Lead"];
    if (experienceLevel && !validLevels.includes(experienceLevel)) {
        return res.status(400).json({ message: "Invalid experience level" });
    }

    try {
        const job = new Job({
            title,
            company,
            location,
            type,
            experienceLevel,
            description,
            skills: skills || [],
            salary,
            deadline: deadline || undefined,
            postedBy: req.user.id,
        });

        await job.save();

        // Trigger Smart Job Alerts for matching seekers
        checkAndNotify(job, req.app.get("io"));

        res.status(201).json(job);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/jobs/:id — Edit job (owner only)
exports.updateJob = async (req, res) => {
    const { title, company, location, type, experienceLevel, description, skills, salary, deadline } = req.body;

    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        if (title !== undefined) job.title = title;
        if (company !== undefined) job.company = company;
        if (location !== undefined) job.location = location;
        if (type !== undefined) job.type = type;
        if (description !== undefined) job.description = description;
        if (skills !== undefined) job.skills = skills;
        if (salary !== undefined) job.salary = salary;
        if (experienceLevel !== undefined) job.experienceLevel = experienceLevel;
        if (deadline !== undefined) job.deadline = deadline;

        await job.save();
        res.json(job);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/jobs/:id — Delete own job (protected)
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await Job.findByIdAndDelete(req.params.id);
        res.json({ message: "Job removed" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
