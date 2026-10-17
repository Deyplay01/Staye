const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    amenities: {
        type: [String],
        default: [],
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending_review", "approved", "rejected"],
        default: "pending_review",
        index: true,
    },
    reviewReason: {
        type: String,
        default: "",
        maxlength: 500,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model("Listing", listingSchema);