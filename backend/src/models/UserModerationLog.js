const mongoose = require("mongoose");

const userModerationLogSchema = new mongoose.Schema(
    {
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        actorUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            enum: ["blocked", "unblocked", "flagged", "unflagged"],
            required: true,
        },
        reason: {
            type: String,
            default: "",
            maxlength: 500,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("UserModerationLog", userModerationLogSchema);
