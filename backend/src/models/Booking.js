const mongoose = require("mongoose");
const { createBookingReference } = require("../utils/bookingReference");

const bookingSchema = new mongoose.Schema({
    publicReference: {
        type: String,
        unique: true,
        sparse: true,
        default: createBookingReference,
        immutable: true,
        index: true,
    },
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: {
        type: Date,
        required: true,
    },
    rooms: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
        validate: {
            validator: Number.isInteger,
            message: "Rooms must be a whole number.",
        },
    },
    status: {
        type: String,
        enum: ["pending_payment", "confirmed", "cancelled"],
        default: "pending_payment",
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "failed", "refunded"],
        default: "unpaid",
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: "usd",
        lowercase: true,
    },
    paymentReference: {
        type: String,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);