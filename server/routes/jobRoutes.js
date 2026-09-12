const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const validators = require("../middleware/validators");
const { validate } = require("../middleware/errorHandler");
const { getJobs, getJobById, createJob, updateJob, deleteJob } = require("../controllers/jobController");

// Public routes
router.get("/", getJobs);
router.get("/:id", getJobById);

// Protected routes (employer only)
router.post("/", auth, requireRole("employer"), validators.createJob, validate, createJob);
router.put("/:id", auth, requireRole("employer"), validators.updateJob, validate, updateJob);
router.delete("/:id", auth, requireRole("employer"), deleteJob);

module.exports = router;
