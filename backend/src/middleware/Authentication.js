const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { User } = require("../models/User");
const { getUserRole } = require("../utils/roles");
dotenv.config();

module.exports = async function (req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("role isAdmin status");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }
    if (user.status === "blocked") {
      return res.status(401).json({ message: "This account is blocked. Contact support for assistance." });
    }
    const role = getUserRole(user);
    req.user = { ...decoded, role, isAdmin: role !== "guest" };
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};