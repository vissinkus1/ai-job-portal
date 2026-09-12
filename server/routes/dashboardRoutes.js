const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getEmployerStats, getJobAppCounts, getSeekerStats } = require("../controllers/dashboardController");

router.get("/employer-stats", auth, getEmployerStats);
router.get("/seeker-stats", auth, getSeekerStats);
router.get("/job-app-counts", auth, getJobAppCounts);

module.exports = router;
