const Job = require("../models/Job");

// Helper to extract numeric salary value
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

// GET /api/search/autocomplete?q=
exports.autocomplete = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.json([]);
        }

        // Use regex for partial matching on title or company
        const regex = new RegExp(query, "i");
        const suggestions = await Job.find({
            $or: [{ title: regex }, { company: regex }],
            deadline: { $not: { $lt: new Date() } } // Only active jobs
        })
            .select("title company")
            .limit(8)
            .lean();

        // Format suggestions uniquely
        const unique = new Map();
        suggestions.forEach((job) => {
            const key = `${job.title} at ${job.company}`;
            if (!unique.has(key)) {
                unique.set(key, { title: job.title, company: job.company, _id: job._id });
            }
        });

        res.json(Array.from(unique.values()));
    } catch (error) {
        console.error("[Autocomplete Error]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/search/jobs
exports.searchJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const sortParam = req.query.sort || "relevance"; // default to relevance if searching
        const search = req.query.search || req.query.q;
        const { location, type, experienceLevel, salaryMin, salaryMax } = req.query;

        // Build base filter
        const filter = {};
        
        // Exclude expired jobs
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

        if (location) filter.location = new RegExp(location, "i");
        if (type) filter.type = type;
        if (experienceLevel) filter.experienceLevel = experienceLevel;

        let query;
        let isTextSearch = false;

        if (search) {
            isTextSearch = true;
            filter.$text = { $search: search };
            query = Job.find(filter, { score: { $meta: "textScore" } })
                .populate("postedBy", "name email");

            // Handle sorting
            if (sortParam === "relevance") {
                query = query.sort({ score: { $meta: "textScore" } });
            } else if (sortParam === "newest") {
                query = query.sort("-createdAt");
            } else if (sortParam === "popular") {
                query = query.sort("-views -applicationCount");
            }
        } else {
            // No search term, just standard listing
            query = Job.find(filter).populate("postedBy", "name email");
            if (sortParam === "newest" || sortParam === "relevance") {
                query = query.sort("-createdAt"); // Fallback for relevance without text
            } else if (sortParam === "popular") {
                query = query.sort("-views -applicationCount");
            }
        }

        const hasSalaryFilter = salaryMin || salaryMax;

        if (!hasSalaryFilter) {
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

        // Apply salary post-filter
        let jobs = await query;
        const min = salaryMin ? parseFloat(salaryMin) : 0;
        const max = salaryMax ? parseFloat(salaryMax) : Infinity;
        
        jobs = jobs.filter((job) => {
            const val = parseSalaryText(job.salary);
            if (val === null) return false;
            return val >= min && val <= max;
        });

        const total = jobs.length;
        const totalPages = Math.ceil(total / limit);
        const paged = jobs.slice((page - 1) * limit, page * limit);
        
        res.json({ jobs: paged, currentPage: page, totalPages, total });
    } catch (error) {
        console.error("[Search Error]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Simple in-memory trending search terms (in a real app, use Redis or DB)
const trendingSearches = ["React", "Node.js", "Frontend Developer", "Machine Learning", "Remote"];

// GET /api/search/trending
exports.getTrending = async (req, res) => {
    res.json(trendingSearches);
};
