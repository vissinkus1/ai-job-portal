const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getConversations, getMessages, sendMessage } = require("../controllers/chatController");

router.get("/conversations", auth, getConversations);
router.get("/:userId", auth, getMessages);
router.post("/:userId", auth, sendMessage);

module.exports = router;
