const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    getResumeScore,
    getATSCheck,
    getBenchmark,
} = require("../controllers/resumeScoreController");

// All routes require authentication
router.get("/score", auth, getResumeScore);
router.get("/ats-check", auth, getATSCheck);
router.get("/benchmark", auth, getBenchmark);

module.exports = router;
