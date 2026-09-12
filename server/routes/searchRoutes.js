const express = require("express");
const validators = require("../middleware/validators");
const { validate } = require("../middleware/errorHandler");
const { autocomplete, searchJobs, getTrending } = require("../controllers/searchController");

const router = express.Router();

// Public routes (no auth required for searching)
router.get("/autocomplete", autocomplete);
router.get("/jobs", validators.searchJobs, validate, searchJobs);
router.get("/trending", getTrending);

module.exports = router;
