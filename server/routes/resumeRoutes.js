const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadResume, getResume, deleteResume } = require("../controllers/resumeController");

router.post("/upload", auth, upload.single("resume"), uploadResume);
router.get("/me", auth, getResume);
router.delete("/me", auth, deleteResume);

module.exports = router;
