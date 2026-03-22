const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { toggleSaveJob, getSavedJobs, checkSaved } = require("../controllers/savedJobController");

router.post("/:jobId", auth, toggleSaveJob);
router.get("/", auth, getSavedJobs);
router.get("/check/:jobId", auth, checkSaved);

module.exports = router;
