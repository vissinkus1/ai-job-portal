const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    applyToJob,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus,
    checkApplication,
    exportApplicants,
} = require("../controllers/applicationController");

// All routes are protected
router.post("/:jobId", auth, applyToJob);
router.get("/me", auth, getMyApplications);
router.get("/check/:jobId", auth, checkApplication);
router.get("/job/:jobId/export", auth, exportApplicants);
router.get("/job/:jobId", auth, getJobApplicants);
router.put("/:id/status", auth, updateApplicationStatus);

module.exports = router;
