const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const validators = require("../middleware/validators");
const { validate } = require("../middleware/errorHandler");
const {
    submitReport,
    getReports,
    updateReport,
    removeReportedJob,
} = require("../controllers/reportController");

// User: submit a report (authenticated)
router.post("/:jobId", auth, validators.createReport, validate, submitReport);

// Admin: view all reports
router.get("/admin/all", auth, admin, getReports);

// Admin: update report status (reviewed/dismissed)
router.put("/admin/:id", auth, admin, updateReport);

// Admin: remove the reported job
router.delete("/admin/:id/remove-job", auth, admin, removeReportedJob);

module.exports = router;
