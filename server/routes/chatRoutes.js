const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validators = require("../middleware/validators");
const { validate } = require("../middleware/errorHandler");
const { getConversations, getMessages, sendMessage } = require("../controllers/chatController");

router.get("/conversations", auth, getConversations);
router.get("/:userId", auth, getMessages);
router.post("/:userId", auth, validators.sendMessage, validate, sendMessage);

module.exports = router;
