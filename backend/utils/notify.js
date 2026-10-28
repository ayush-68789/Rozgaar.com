const { Notification } = require('../models/notification.model.js');

// Notifications must never break the main request, so failures are only logged.
const notify = async (userId, { type = 'info', title, message = '', link = '' }) => {
    try {
        if (!userId) return;
        await Notification.create({ user: userId, type, title, message, link });
    } catch (error) {
        console.error('Failed to create notification:', error.message);
    }
};

module.exports = { notify };
