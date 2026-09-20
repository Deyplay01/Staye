const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
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
    images: {
        type: [String],
        default: [],
    },
    amenities: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

roomSchema.index({ listingId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Room", roomSchema);
