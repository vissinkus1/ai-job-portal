const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getStats, getCharts } = require("../controllers/adminController");

router.get("/stats", auth, getStats);
router.get("/charts", auth, getCharts);

module.exports = router;
