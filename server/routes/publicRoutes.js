const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Job = require("../models/Job");

// GET /api/public/stats — Public stats for the home page (no auth required)
router.get("/stats", async (req, res) => {
    try {
        const [totalJobs, totalSeekers] = await Promise.all([
            Job.countDocuments(),
            User.countDocuments({ role: "seeker" }),
        ]);

        // Count unique companies from job postings
        const companies = await Job.distinct("company");

        res.json({
            totalJobs,
            totalCompanies: companies.length,
            totalSeekers,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
});

const { getSimilarJobs, getFeaturedJobs } = require("../controllers/publicController");
router.get("/similar/:jobId", getSimilarJobs);
router.get("/featured", getFeaturedJobs);

module.exports = router;
