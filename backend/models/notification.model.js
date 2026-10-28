const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['application', 'status', 'coach', 'info'], default: 'info' },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };
