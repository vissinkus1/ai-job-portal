const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validators = require("../middleware/validators");
const { validate } = require("../middleware/errorHandler");
const {
    applyToJob,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus,
    checkApplication,
    exportApplicants,
    withdrawApplication,
    updateNotes,
} = require("../controllers/applicationController");

// All routes are protected
router.post("/:jobId", auth, validators.applyToJob, validate, applyToJob);
router.get("/me", auth, getMyApplications);
router.get("/check/:jobId", auth, checkApplication);
router.get("/job/:jobId/export", auth, exportApplicants);
router.get("/job/:jobId", auth, getJobApplicants);
router.put("/:id/status", auth, validators.updateApplicationStatus, validate, updateApplicationStatus);
router.put("/:id/notes", auth, validators.updateApplicationNotes, validate, updateNotes);
router.delete("/:id", auth, withdrawApplication);

module.exports = router;
