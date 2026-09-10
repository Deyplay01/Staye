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
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    totalRooms: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
        validate: {
            validator: Number.isInteger,
            message: "Total rooms must be a whole number.",
        },
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
}, { timestamps: true });

module.exports = mongoose.model("Listing", listingSchema);