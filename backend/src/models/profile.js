const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    username: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    bio: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    gender:{
        type: String,
        default: ""
    },
    dob: {
        type: Date,
        default: null
    },
    avatar: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("Profile", profileSchema);
