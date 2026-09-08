const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { User } = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET ;

const Profile = require("../models/profile");

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: "Name, email, and a password of at least 6 characters are required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
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

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
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
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user: { id: user._id, name: user.name, isAdmin: user.isAdmin, } });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

module.exports = router;