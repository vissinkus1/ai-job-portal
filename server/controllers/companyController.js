const Company = require("../models/Company");
const Job = require("../models/Job");
const User = require("../models/User");

// POST /api/company — Create or update company profile
exports.createOrUpdateCompany = async (req, res) => {
    try {
        const { name, description, industry, size, founded, website, locations, benefits, culture, socialLinks } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Company name is required" });
        }

        let company = await Company.findOne({ owner: req.user.id });

        if (company) {
            // Update existing
            company.name = name.trim();
            if (description !== undefined) company.description = description;
            if (industry !== undefined) company.industry = industry;
            if (size !== undefined) company.size = size;
            if (founded !== undefined) company.founded = founded;
            if (website !== undefined) company.website = website;
            if (locations !== undefined) company.locations = locations;
            if (benefits !== undefined) company.benefits = benefits;
            if (culture !== undefined) company.culture = culture;
            if (socialLinks !== undefined) company.socialLinks = { ...company.socialLinks, ...socialLinks };

            await company.save();
            return res.json({ message: "Company profile updated", company });
        }

        // Create new
        company = new Company({
            owner: req.user.id,
            name: name.trim(),
            description: description || "",
            industry: industry || "",
            size: size || "",
            founded: founded || "",
            website: website || "",
            locations: locations || [],
            benefits: benefits || [],
            culture: culture || "",
            socialLinks: socialLinks || {},
        });

        await company.save();
        res.status(201).json({ message: "Company profile created", company });
    } catch (error) {
        console.error("[Company Create/Update]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/company/me — Get my company profile
exports.getMyCompany = async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ message: "No company profile found. Create one to get started." });
        }
        res.json(company);
    } catch (error) {
        console.error("[My Company]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/company/:id — Get company profile by ID (public)
exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate("owner", "name email profilePicture");

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Also fetch the company's active jobs
        const jobs = await Job.find({
            postedBy: company.owner._id || company.owner,
            $or: [
                { deadline: { $exists: false } },
                { deadline: null },
                { deadline: { $gte: new Date() } },
            ],
        })
            .select("title location type experienceLevel salary createdAt views applicationCount")
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ company, jobs });
    } catch (error) {
        console.error("[Company By ID]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/company/by-owner/:userId — Get company by owner user ID (public)
exports.getCompanyByOwner = async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.params.userId })
            .populate("owner", "name email profilePicture");

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        const jobs = await Job.find({
            postedBy: req.params.userId,
            $or: [
                { deadline: { $exists: false } },
                { deadline: null },
                { deadline: { $gte: new Date() } },
            ],
        })
            .select("title location type experienceLevel salary createdAt views applicationCount")
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ company, jobs });
    } catch (error) {
        console.error("[Company By Owner]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/company/logo — Upload company logo
exports.uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ message: "Create a company profile first" });
        }

        company.logo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedAt: new Date(),
        };

        await company.save();
        res.json({ message: "Logo uploaded", logo: company.logo });
    } catch (error) {
        console.error("[Logo Upload]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/company — Delete company profile
exports.deleteCompany = async (req, res) => {
    try {
        const result = await Company.findOneAndDelete({ owner: req.user.id });
        if (!result) {
            return res.status(404).json({ message: "Company not found" });
        }
        res.json({ message: "Company profile deleted" });
    } catch (error) {
        console.error("[Company Delete]", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
