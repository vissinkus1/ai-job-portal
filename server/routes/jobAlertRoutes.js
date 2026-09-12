const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validators = require("../middleware/validators");
const { validate } = require("../middleware/errorHandler");
const {
    createAlert,
    getMyAlerts,
    updateAlert,
    deleteAlert,
    previewAlert,
} = require("../controllers/jobAlertController");

router.post("/", auth, validators.createAlert, validate, createAlert);
router.get("/", auth, getMyAlerts);
router.put("/:id", auth, validators.updateAlert, validate, updateAlert);
router.delete("/:id", auth, deleteAlert);
router.get("/:id/preview", auth, previewAlert);

module.exports = router;
