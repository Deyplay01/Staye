const Notification = require("../models/Notification");

async function createNotification({ userId, type, title, message, bookingId = null, listingId = null }) {
    if (!userId) return null;
    try {
        return await Notification.create({ userId, type, title, message, bookingId, listingId });
    } catch (error) {
        console.error("Could not create notification:", error.message);
        return null;
    }
}

module.exports = { createNotification };
