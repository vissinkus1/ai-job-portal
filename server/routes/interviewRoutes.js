const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validators = require("../middleware/validators");
const { validate } = require("../middleware/errorHandler");
const {
    scheduleInterview,
    getInterviewsForJob,
    getMyInterviews,
    updateInterview,
} = require("../controllers/interviewController");

router.post("/", auth, validators.scheduleInterview, validate, scheduleInterview);
router.get("/job/:jobId", auth, getInterviewsForJob);
router.get("/me", auth, getMyInterviews);
router.put("/:id", auth, validators.updateInterview, validate, updateInterview);

module.exports = router;
