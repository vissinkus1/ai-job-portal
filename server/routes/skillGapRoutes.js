const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    getSkillGapAnalysis,
    getReadinessScore,
    getTrendingPaths,
    getAvailableRoles,
} = require("../controllers/skillGapController");

// All routes require authentication
router.get("/analysis", auth, getSkillGapAnalysis);
router.get("/readiness-score", auth, getReadinessScore);
router.get("/trending-paths", auth, getTrendingPaths);
router.get("/roles", auth, getAvailableRoles);

module.exports = router;
