const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/Authentication");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        const unreadCount = await Notification.countDocuments({ userId: req.user.userId, readAt: null });
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Could not load notifications." });
    }
});

router.patch("/:id/read", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid notification ID." });
        }
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { $set: { readAt: new Date() } },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: "Notification not found." });
        res.json({ notification });
    } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ message: "Could not update notification." });
    }
});

router.patch("/read-all", authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.userId, readAt: null }, { $set: { readAt: new Date() } });
        res.json({ message: "Notifications marked as read." });
    } catch (error) {
        console.error("Error marking notifications read:", error);
        res.status(500).json({ message: "Could not update notifications." });
    }
});

module.exports = router;
