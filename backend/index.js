const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const profileRoutes = require("./src/routes/profile");
const listingsRoutes = require("./src/routes/listings");
const bookingRoutes = require("./src/routes/booking");
const paymentRoutes = require("./src/routes/payments");
const uploadRoutes = require("./src/routes/uploads");
const Listing = require("./src/models/Listings");
const cors = require("cors");
const path = require("path");
const dns = require("dns");

dns.setServers(["8.8.8.8"]);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOptions = {
    origin: allowedOrigins,
    methods: "GET,PUT,POST,DELETE",
    credentials: "true"
};

app.use(cors(corsOptions));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentRoutes.handleWebhook);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;


app.get("/", (req, res) => {
  res.send("Welcome to the Hotel Booking System API");
}
);

if (!MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET must be configured.");
}

mongoose.connect(MONGODB_URI).then(async () => {
    await Listing.updateMany(
        { $or: [{ totalRooms: { $exists: false } }, { totalRooms: null }] },
        { $set: { totalRooms: 1 } }
    );
    app.listen(PORT, () => {
        console.log("Server running on port:", PORT);
    })
}).catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
});