const { Notification } = require("../models/notification.model.js");

const listNotifications = async (req, res) => {
    try {
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ user: req.id }).sort({ createdAt: -1 }).limit(30),
            Notification.countDocuments({ user: req.id, read: false })
        ]);
        return res.status(200).json({ notifications, unreadCount, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to load notifications.', success: false });
    }
};

const markRead = async (req, res) => {
    try {
        await Notification.updateOne({ _id: req.params.id, user: req.id }, { $set: { read: true } });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to update notification.', success: false });
    }
};

const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.id, read: false }, { $set: { read: true } });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to update notifications.', success: false });
    }
};

module.exports = { listNotifications, markRead, markAllRead };
