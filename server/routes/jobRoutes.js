const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getJobs, getJobById, createJob, updateJob, deleteJob } = require("../controllers/jobController");

// Public routes
router.get("/", getJobs);
router.get("/:id", getJobById);

// Protected routes
router.post("/", auth, createJob);
router.put("/:id", auth, updateJob);
router.delete("/:id", auth, deleteJob);

module.exports = router;
