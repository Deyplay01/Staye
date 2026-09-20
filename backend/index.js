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
const Listing = require("./src/models/Listings");
const Room = require("./src/models/Room");
const Booking = require("./src/models/Booking");
const { createBookingReference } = require("./src/utils/bookingReference");
const cors = require("cors");
const path = require("path");
const dns = require("dns");

dns.setServers(["8.8.8.8"]);

const allowedOrigins = (process.env.FRONTEND_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOptions = {
    origin: allowedOrigins,
    methods: "GET,PUT,POST,PATCH,DELETE",
    credentials: "true"
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
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentRoutes.handleWebhook);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/bookings", bookingLimiter, bookingRoutes);
app.use("/api/payments", paymentLimiter, paymentRoutes);
app.use("/api/uploads", uploadLimiter, uploadRoutes);
app.use("/api/notifications", notificationsRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function migrateLegacyListings() {
    const legacyListings = await Listing.collection.find({}).toArray();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const listing of legacyListings) {
        const roomCount = await Room.countDocuments({ listingId: listing._id });
        if (roomCount > 0) continue;

        const price = Number(listing.price);
        const totalRooms = Number(listing.totalRooms || 1);
        if (!Number.isFinite(price) || price < 0 || !Number.isInteger(totalRooms) || totalRooms < 1) {
            skippedCount += 1;
            continue;
        }

        await Room.updateOne(
            { listingId: listing._id, name: "Classic" },
            {
                $setOnInsert: {
                    listingId: listing._id,
                    name: "Classic",
                    description: listing.description || "",
                    price,
                    totalRooms,
                    images: Array.isArray(listing.images) ? listing.images : [],
                    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
                },
            },
            { upsert: true }
        );
        migratedCount += 1;
    }

    console.log(`Legacy listing migration complete: ${migratedCount} migrated, ${skippedCount} skipped.`);
}

async function migrateBookingReferences() {
    const bookings = await Booking.find({ $or: [{ publicReference: { $exists: false } }, { publicReference: null }] }).select("_id publicReference");
    for (const booking of bookings) {
        let publicReference;
        do {
            publicReference = createBookingReference();
        } while (await Booking.exists({ publicReference }));
        await Booking.collection.updateOne({ _id: booking._id }, { $set: { publicReference } });
    }
    console.log(`Booking reference migration complete: ${bookings.length} updated.`);
}

app.get("/", (req, res) => {
  res.send("Welcome to the Hotel Booking System API");
}
);

if (!MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET must be configured.");
}

mongoose.connect(MONGODB_URI).then(async () => {
    await migrateLegacyListings();
    await migrateBookingReferences();
    app.listen(PORT, () => {
        console.log("Server running on port:", PORT);
    })
}).catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
});