const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");
const { User } = require("../models/User");
const Profile = require("../models/profile");
const { getUserRole, requireRoles } = require("../utils/roles");
const authMiddleware = require("../middleware/Authentication");
const Listing = require("../models/Listings");
const Room = require("../models/Room");
const UserModerationLog = require("../models/UserModerationLog");

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleCredential(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload.email || !payload.email_verified) {
    throw new Error("Google account email is not verified.");
  }
  return payload;
}

async function ensureProfile(user, avatar = "") {
  const profile = await Profile.findOneAndUpdate(
    { username: user._id },
    { $setOnInsert: { username: user._id, bio: "", phone: "", gender: "", dob: null, avatar, location: "" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  if (!profile.avatar && avatar) {
    profile.avatar = avatar;
    await profile.save();
  }
  return profile;
}

function hostSession(user, avatar = "") {
  const role = getUserRole(user);
  const token = jwt.sign({ userId: user._id, role }, JWT_SECRET, { expiresIn: "1h" });
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, avatar, role, isAdmin: role !== "guest" },
  };
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim() || password.length < 8) {
    return res.status(400).json({
      message: "Name, email, and a password of at least 8 characters are required.",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists for this email." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: "host",
    });
    await ensureProfile(user);

    return res.status(201).json(hostSession(user));
  } catch (error) {
    console.error("Error during host registration:", error);
    return res.status(500).json({ message: "Error during host registration" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const role = getUserRole(user);
    if (!user || !["host", "admin"].includes(role) || !user.password) {
      return res.status(401).json({ message: "Invalid host credentials" });
    }
    if (user.status === "blocked") {
      return res.status(403).json({ message: "This account is blocked. Contact support for assistance." });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid host credentials" });
    }

    const profile = await ensureProfile(user);
    return res.json(hostSession(user, profile.avatar));
  } catch (error) {
    console.error("Error during host login:", error);
    return res.status(500).json({ message: "Error during host login" });
  }
});

router.post("/google/login", async (req, res) => {
  try {
    const payload = await verifyGoogleCredential(req.body.credential);
    const user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user || !["host", "admin"].includes(getUserRole(user))) {
      return res.status(403).json({ message: "This Google account does not have host access." });
    }
    if (user.status === "blocked") {
      return res.status(403).json({ message: "This account is blocked. Contact support for assistance." });
    }

    if (!user.google_id) {
      user.google_id = payload.sub;
      await user.save();
    }

    const profile = await ensureProfile(user, payload.picture || "");
    return res.json(hostSession(user, profile.avatar));
  } catch (error) {
    console.error("Error during host Google login:", error);
    return res.status(401).json({ message: "Host Google authentication failed." });
  }
});

router.post("/google/register", async (req, res) => {
  if (!req.body.credential) {
    return res.status(400).json({ message: "Google credential is required." });
  }

  try {
    const payload = await verifyGoogleCredential(req.body.credential);
    const email = payload.email.toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists for this Google email." });
    }

    const user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      google_id: payload.sub,
      role: "host",
    });
    await ensureProfile(user, payload.picture || "");
    return res.status(201).json(hostSession(user, payload.picture || ""));
  } catch (error) {
    console.error("Error during host Google registration:", error);
    return res.status(401).json({ message: "Host Google registration failed." });
  }
});

router.get("/users", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 25);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: "Page must be positive and limit must be between 1 and 100." });
    }

    const filter = {};
    if (req.query.role) {
      if (!["guest", "host", "admin"].includes(req.query.role)) {
        return res.status(400).json({ message: "Invalid role filter." });
      }
      filter.role = req.query.role;
    } else {
      filter.role = { $in: ["guest", "host", "admin"] };
    }
    if (req.query.status) {
      if (!["active", "blocked"].includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid account status filter." });
      }
      filter.status = req.query.status;
    }
    if (req.query.flagged === "true") filter.isFlagged = true;
    if (req.query.flagged === "false") filter.isFlagged = false;
    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email role status isFlagged flagReason flaggedAt blockedAt blockReason createdAt")
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    res.json({ users, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching managed users:", error);
    res.status(500).json({ message: "Could not load users." });
  }
});

router.get("/users/:id/moderation-history", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    const history = await UserModerationLog.find({ targetUserId: req.params.id })
      .populate("actorUserId", "name email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ history });
  } catch (error) {
    console.error("Error fetching user moderation history:", error);
    res.status(500).json({ message: "Could not load moderation history." });
  }
});

router.patch("/users/:id/flag", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    if (!requireValidModerationTarget(req, res)) return;
    const { isFlagged, reason } = req.body;
    if (typeof isFlagged !== "boolean") {
      return res.status(400).json({ message: "isFlagged must be true or false." });
    }
    const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
    if (isFlagged && !cleanReason) {
      return res.status(400).json({ message: "A reason is required when flagging an account." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });
    if (!["guest", "host"].includes(getUserRole(target))) {
      return res.status(403).json({ message: "Only guest and host accounts can be flagged." });
    }

    target.isFlagged = isFlagged;
    target.flagReason = isFlagged ? cleanReason : "";
    target.flaggedAt = isFlagged ? new Date() : null;
    target.flaggedBy = isFlagged ? req.user.userId : null;
    const session = await User.startSession();
    try {
      await session.withTransaction(async () => {
        await target.save({ session });
        await UserModerationLog.create([{
          targetUserId: target._id,
          actorUserId: req.user.userId,
          action: isFlagged ? "flagged" : "unflagged",
          reason: cleanReason,
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.json({ message: isFlagged ? "Account flagged." : "Account flag cleared.", user: serializeManagedUser(target) });
  } catch (error) {
    console.error("Error changing user flag:", error);
    res.status(500).json({ message: "Could not update account flag." });
  }
});

router.patch("/users/:id/block", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    if (!requireValidModerationTarget(req, res)) return;
    const { blocked, reason } = req.body;
    if (typeof blocked !== "boolean") {
      return res.status(400).json({ message: "blocked must be true or false." });
    }
    const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
    if (blocked && !cleanReason) {
      return res.status(400).json({ message: "A reason is required when blocking an account." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });
    if (!["guest", "host"].includes(getUserRole(target))) {
      return res.status(403).json({ message: "Only guest and host accounts can be blocked." });
    }

    target.status = blocked ? "blocked" : "active";
    target.blockReason = blocked ? cleanReason : "";
    target.blockedAt = blocked ? new Date() : null;
    target.blockedBy = blocked ? req.user.userId : null;
    const session = await User.startSession();
    try {
      await session.withTransaction(async () => {
        await target.save({ session });
        await UserModerationLog.create([{
          targetUserId: target._id,
          actorUserId: req.user.userId,
          action: blocked ? "blocked" : "unblocked",
          reason: cleanReason,
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.json({ message: blocked ? "Account blocked." : "Account unblocked.", user: serializeManagedUser(target) });
  } catch (error) {
    console.error("Error changing user block status:", error);
    res.status(500).json({ message: "Could not update account status." });
  }
});

router.get("/listings/review", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    const status = req.query.status || "pending_review";
    if (!["pending_review", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid listing review status." });
    }
    const listings = await Listing.find({ status })
      .populate("hostId", "name email")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
    const listingIds = listings.map((listing) => listing._id);
    const rooms = await Room.find({ listingId: { $in: listingIds } }).sort({ price: 1, name: 1 }).lean();
    const roomsByListing = new Map();
    for (const room of rooms) {
      const key = room.listingId.toString();
      if (!roomsByListing.has(key)) roomsByListing.set(key, []);
      roomsByListing.get(key).push(room);
    }
    res.json({
      listings: listings.map((listing) => ({ ...listing, rooms: roomsByListing.get(listing._id.toString()) || [] })),
    });
  } catch (error) {
    console.error("Error fetching listings for review:", error);
    res.status(500).json({ message: "Could not load listings for review." });
  }
});

router.patch("/listings/:id/review", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    const { decision, reason } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approved or rejected." });
    }
    const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
    if (decision === "rejected" && !cleanReason) {
      return res.status(400).json({ message: "A reason is required when rejecting a listing." });
    }
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid listing ID." });
    }
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: "pending_review" },
      {
        $set: {
          status: decision,
          reviewReason: decision === "rejected" ? cleanReason : "",
          reviewedAt: new Date(),
          reviewedBy: req.user.userId,
        },
      },
      { new: true, runValidators: true },
    ).populate("hostId", "name email");
    if (!listing) {
      return res.status(404).json({ message: "Pending listing not found." });
    }
    res.json({ message: `Listing ${decision}.`, listing });
  } catch (error) {
    console.error("Error reviewing listing:", error);
    res.status(500).json({ message: "Could not review listing." });
  }
});

function requireValidModerationTarget(req, res) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    res.status(400).json({ message: "Invalid user ID." });
    return false;
  }
  if (req.params.id === req.user.userId) {
    res.status(403).json({ message: "You cannot moderate your own account." });
    return false;
  }
  return true;
}

function serializeManagedUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: getUserRole(user),
    status: user.status || "active",
    isFlagged: user.isFlagged || false,
    flagReason: user.flagReason || "",
    flaggedAt: user.flaggedAt || null,
    blockedAt: user.blockedAt || null,
    blockReason: user.blockReason || "",
  };
}

module.exports = router;
