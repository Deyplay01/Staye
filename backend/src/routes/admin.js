const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { User } = require("../models/User");
const Profile = require("../models/profile");

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

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
      user: { id: user._id, name: user.name, email: user.email, isAdmin: true },
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

module.exports = router;