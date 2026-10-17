const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { User } = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const Profile = require("../models/profile");
const { getUserRole } = require("../utils/roles");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post("/google/callback", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Missing identity token." });
    }

    // 1. Verify the secure token string coming from the browser button
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload["sub"];
    const { email, name, picture, email_verified: emailVerified } = payload;

    if (!email || !emailVerified) {
      return res.status(401).json({ message: "Google account email is not verified." });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user?.status === "blocked") {
      return res.status(403).json({ message: "This account is blocked. Contact support for assistance." });
    }

    if (user) {
      if (!user.google_id) {
        user.google_id = googleId;
        await user.save();
      }
    } else {
      user = new User({
        name: name,
        email: email.toLowerCase(),
        google_id: googleId,
        role: "guest",
      });
      await user.save();

      const profile = new Profile({
        username: user._id,
        bio: "",
        phone: "",
        gender: "",
        dob: null,
        avatar: picture || "", // Drop their Google profile picture right in!
        location: "",
      });
      await profile.save();
    }

    const profile = await Profile.findOne({ username: user._id });
    if (!profile) {
      await Profile.create({
        username: user._id,
        bio: "",
        phone: "",
        gender: "",
        dob: null,
        avatar: picture || "",
        location: "",
      });
    } else if (!profile.avatar && picture) {
      profile.avatar = picture;
      await profile.save();
    }

    const role = getUserRole(user);
    const token = jwt.sign({ userId: user._id, role }, JWT_SECRET, {
      expiresIn: "1h", 
    });

    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: picture || profile?.avatar || "", role, isAdmin: role !== "guest" },
    });
  } catch (error) {
    console.error("Google feature integration error:", error);
    return res.status(401).json({ message: "Social authentication failed." });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim() || password.length < 6) {
    return res.status(400).json({
      message:
        "Name, email, and a password of at least 6 characters are required.",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "guest",
    });

    await user.save();

    // Create a profile for the new user
    const profile = new Profile({
      username: user._id,
      bio: "",
      phone: "",
      gender: "",
      dob: null,
      avatar: "",
      location: "",
    });

    await profile.save();

    const role = getUserRole(user);
    const token = jwt.sign({ userId: user._id, role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role, isAdmin: role !== "guest" },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check the password
    if (user.status === "blocked") {
      return res.status(403).json({ message: "This account is blocked. Contact support for assistance." });
    }
    const isMatch = user.password && typeof password === "string" ? await bcrypt.compare(password, user.password) : false;
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const profile = await Profile.findOne({ username: user._id });
    if (!profile) {
      const profile = new Profile({
        username: user._id,
        bio: "",
        phone: "",
        gender: "",
        dob: null,
        avatar: "",
        location: "",
      });
      await profile.save();
    }

    // Generate a JWT token
    const role = getUserRole(user);
    const token = jwt.sign(
      { userId: user._id, role },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role, isAdmin: role !== "guest" },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

module.exports = router;
