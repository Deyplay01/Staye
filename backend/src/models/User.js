const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    role: {
      type: String,
      enum: ["guest", "host", "admin"],
      index: true,
    },
    isAdmin: {
      type: Boolean,
      default: undefined,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flagReason: {
      type: String,
      default: "",
      maxlength: 500,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    blockedAt: {
      type: Date,
      default: null,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    blockReason: {
      type: String,
      default: "",
      maxlength: 500,
    },
    password: {
      type: String,
      required: false,
    },
    google_id: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);
module.exports = { User };
