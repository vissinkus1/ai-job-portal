const Job = require("../models/Job");

// GET /api/jobs — List jobs with server-side search, filter, and pagination
exports.getJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const sort = req.query.sort || "-createdAt";
        const { search, location, type } = req.query;

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

        const query = Job.find(filter).populate("postedBy", "name email").sort(sort);

        if (limit > 0) {
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

        // No pagination — return all
        const jobs = await query;
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
        res.json(job);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/jobs — Create job (protected)
exports.createJob = async (req, res) => {
    const { title, company, location, type, description, skills, salary } = req.body;

    try {
        const job = new Job({
            title,
            company,
            location,
            type,
            description,
            skills: skills || [],
            salary,
            postedBy: req.user.id,
        });

        await job.save();
        res.status(201).json(job);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/jobs/:id — Edit job (owner only)
exports.updateJob = async (req, res) => {
    const { title, company, location, type, description, skills, salary } = req.body;

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
