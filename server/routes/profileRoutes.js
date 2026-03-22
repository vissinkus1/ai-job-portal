const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/profileController");

// All profile routes are protected
router.get("/me", auth, getProfile);
router.put("/me", auth, updateProfile);

module.exports = router;
