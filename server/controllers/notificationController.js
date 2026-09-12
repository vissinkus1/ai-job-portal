const Notification = require("../models/Notification");

// GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(30);
        const unreadCount = await Notification.countDocuments({
            user: req.user.id,
            read: false,
        });
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/notifications/read-all
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { read: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper: create notification (used internally)
// Pass optional `io` from req.app.get("io") for real-time push
exports.createNotification = async ({ user, type, title, message, link, io }) => {
    try {
        const notification = new Notification({ user, type, title, message, link });
        await notification.save();

        // Push real-time notification via Socket.io if available
        if (io) {
            io.to(user.toString()).emit("newNotification", {
                _id: notification._id,
                type,
                title,
                message,
                link,
                read: false,
                createdAt: notification.createdAt,
            });
        }

        return notification;
    } catch (error) {
        console.error("Failed to create notification:", error.message);
    }
};
