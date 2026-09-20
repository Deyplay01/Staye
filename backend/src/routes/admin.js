const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");
const { User } = require("../models/User");
const Profile = require("../models/profile");

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

router.post("/register", async (req, res) => {
  const { name, email, password, registrationKey } = req.body;

  if (!name || !email || !password || password.length < 6 || !registrationKey) {
    return res.status(400).json({
      message: "Name, email, password of at least 6 characters, and registrationKey are required.",
    });
  }

  if (!process.env.ADMIN_REGISTRATION_KEY || registrationKey !== process.env.ADMIN_REGISTRATION_KEY) {
    return res.status(403).json({ message: "Invalid admin registration key." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, isAdmin: true });
    await user.save();

    await Profile.create({
      username: user._id,
      bio: "",
      phone: "",
      gender: "",
      dob: null,
      avatar: "",
      location: "",
    });

    const token = jwt.sign({ userId: user._id, isAdmin: true }, JWT_SECRET, { expiresIn: "1h" });

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: payload.picture || profile?.avatar || "", isAdmin: true },
    });
  } catch (error) {
    console.error("Error during admin registration:", error);
    return res.status(500).json({ message: "Error during admin registration" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isAdmin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign({ userId: user._id, isAdmin: true }, JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: true },
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ message: "Error during admin login" });
  }
});

router.post("/google/login", async (req, res) => {
  try {
    const payload = await verifyGoogleCredential(req.body.credential);
    const user = await User.findOne({ email: payload.email.toLowerCase(), isAdmin: true });

    if (!user) {
      return res.status(403).json({ message: "This Google account does not have admin access." });
    }

    if (!user.google_id) {
      user.google_id = payload.sub;
      await user.save();
    }

    const profile = await Profile.findOne({ username: user._id });
    if (!profile) {
      await Profile.create({
        username: user._id,
        bio: "",
        phone: "",
        gender: "",
        dob: null,
        avatar: payload.picture || "",
        location: "",
      });
    } else if (!profile.avatar && payload.picture) {
      profile.avatar = payload.picture;
      await profile.save();
    }

    const token = jwt.sign({ userId: user._id, isAdmin: true }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: true },
    });
  } catch (error) {
    console.error("Error during admin Google login:", error);
    return res.status(401).json({ message: "Admin Google authentication failed." });
  }
});

router.post("/google/register", async (req, res) => {
  const { credential, registrationKey } = req.body;
  if (!credential || !registrationKey || registrationKey !== process.env.ADMIN_REGISTRATION_KEY) {
    return res.status(403).json({ message: "A valid admin registration key is required." });
  }

  try {
    const payload = await verifyGoogleCredential(credential);
    const email = payload.email.toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account already exists for this Google email." });
    }

    const user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      google_id: payload.sub,
      isAdmin: true,
    });
    await Profile.create({ username: user._id, bio: "", phone: "", gender: "", dob: null, avatar: payload.picture || "", location: "" });

    const token = jwt.sign({ userId: user._id, isAdmin: true }, JWT_SECRET, { expiresIn: "1h" });
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: true },
    });
  } catch (error) {
    console.error("Error during admin Google registration:", error);
    return res.status(401).json({ message: "Admin Google registration failed." });
  }
});

module.exports = router;