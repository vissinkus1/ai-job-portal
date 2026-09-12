const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const { getStats, getCharts, getUsers, updateUserRole, toggleBan } = require("../controllers/adminController");

router.get("/stats", auth, admin, getStats);
router.get("/charts", auth, admin, getCharts);
router.get("/users", auth, admin, getUsers);
router.put("/users/:id/role", auth, admin, updateUserRole);
router.put("/users/:id/ban", auth, admin, toggleBan);

module.exports = router;
