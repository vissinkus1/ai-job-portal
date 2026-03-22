const Message = require("../models/Message");
const User = require("../models/User");

// GET /api/chat/conversations — List unique conversations
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all unique users this user has messaged or received from
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).sort({ createdAt: -1 });

        const conversationMap = new Map();

        for (const msg of messages) {
            const otherId =
                msg.sender.toString() === userId
                    ? msg.receiver.toString()
                    : msg.sender.toString();

            if (!conversationMap.has(otherId)) {
                conversationMap.set(otherId, {
                    userId: otherId,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    unread: msg.receiver.toString() === userId && !msg.read ? 1 : 0,
                });
            } else if (msg.receiver.toString() === userId && !msg.read) {
                conversationMap.get(otherId).unread += 1;
            }
        }

        // Populate user info
        const convos = [];
        for (const [otherId, data] of conversationMap) {
            const user = await User.findById(otherId).select("name email role");
            if (user) {
                convos.push({ ...data, user });
            }
        }

        res.json(convos);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/chat/:userId — Message history
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherId },
                { sender: otherId, receiver: userId },
            ],
        }).sort({ createdAt: 1 });

        // Mark received messages as read
        await Message.updateMany(
            { sender: otherId, receiver: userId, read: false },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/chat/:userId — Send message
exports.sendMessage = async (req, res) => {
    try {
        const { content, jobId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const message = new Message({
            sender: req.user.id,
            receiver: req.params.userId,
            content: content.trim(),
            jobId: jobId || undefined,
        });

        await message.save();

        // Emit via Socket.io if available
        const io = req.app.get("io");
        if (io) {
            io.to(req.params.userId).emit("newMessage", {
                ...message.toObject(),
                sender: req.user.id,
            });
        }

        res.status(201).json(message);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};
