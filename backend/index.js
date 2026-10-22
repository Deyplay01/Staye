const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
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
const notificationsRoutes = require("./src/routes/notifications");
const cors = require("cors");
const uploadDirectory = require("./src/utils/uploadDirectory");

if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const frontendOrigins = process.env.FRONTEND_URL
    || (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173");
if (!frontendOrigins) {
    throw new Error("FRONTEND_URL must be configured in production.");
}
const allowedOrigins = frontendOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:5173", "http://127.0.0.1:5173");
}
const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "HEAD", "PUT", "POST", "PATCH", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 204,
};

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

const isProduction = process.env.NODE_ENV === "production";
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 500 : 5000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 15 : 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Please try again later." },
});

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 30 : 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many payment requests. Please try again later." },
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 30 : 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many upload requests. Please try again later." },
});

const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 120 : 1000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many booking requests. Please try again later." },
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors(corsOptions));
app.use("/api", apiLimiter);
app.get("/health/live", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.get("/health/ready", (_req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ status: "not_ready", database: "disconnected" });
    }
    res.status(200).json({ status: "ready", database: "connected" });
});
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentRoutes.handleWebhook);
app.use(express.json());
app.use("/uploads", express.static(uploadDirectory));
app.use("/api/auth", authLimiter, authRoutes);
app.use([
    "/api/admin/register",
    "/api/admin/login",
    "/api/admin/google/login",
    "/api/admin/google/register",
], authLimiter);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/bookings", bookingLimiter, bookingRoutes);
app.use("/api/payments", paymentLimiter, paymentRoutes);
app.use("/api/uploads", uploadLimiter, uploadRoutes);
app.use("/api/notifications", notificationsRoutes);

const PORT = process.env.PORT || (process.env.NODE_ENV === "production" ? 10000 : 5000);
const MONGODB_URI = process.env.MONGODB_URI;

app.get("/", (req, res) => {
  res.send("Welcome to the Hotel Booking System API");
}
);

if (!MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET must be configured.");
}

mongoose.connect(MONGODB_URI).then(async () => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log("Server running on port:", PORT);
    })
}).catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
});