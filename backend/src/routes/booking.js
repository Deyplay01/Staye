const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Booking = require("../models/Booking");
const Listing = require("../models/Listings");
const authMiddleware = require("../middleware/Authentication");

function parseBookingDates(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!checkIn || !checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        return null;
    }
    return { start, end };
}

async function getBookedRooms(listingId, start, end, bookingId, session) {
    const filter = {
        listingId,
        $or: [
            { status: "confirmed" },
            { status: "pending_payment", paymentStatus: "unpaid" },
        ],
        checkIn: { $lt: end },
        checkOut: { $gt: start },
    };
    if (bookingId) filter._id = { $ne: bookingId };
    const query = Booking.find(filter).select("rooms");
    if (session) query.session(session);
    const bookings = await query;
    return bookings.reduce((total, booking) => total + booking.rooms, 0);
}

function parseRooms(value) {
    const rooms = value === undefined ? 1 : Number(value);
    return Number.isInteger(rooms) && rooms > 0 ? rooms : null;
}

function parseDashboardDates(checkIn, checkOut) {
    if (checkIn === undefined && checkOut === undefined) {
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }
    return parseBookingDates(checkIn, checkOut);
}

// Create a new booking
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { listingId, checkIn, checkOut } = req.body;
        const rooms = parseRooms(req.body.rooms);
        if (!mongoose.isValidObjectId(listingId)) {
            return res.status(400).json({ message: "A valid listing ID is required." });
        }
        if (!rooms) {
            return res.status(400).json({ message: "Rooms must be a positive whole number." });
        }
        const dates = parseBookingDates(checkIn, checkOut);
        if (!dates) {
            return res.status(400).json({ message: "Check-out must be after check-in, using valid dates." });
        }
        let newBooking;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const listing = await Listing.findById(listingId).session(session);
                if (!listing) {
                    const error = new Error("Listing not found.");
                    error.statusCode = 404;
                    throw error;
                }
                const bookedRooms = await getBookedRooms(listingId, dates.start, dates.end, undefined, session);
                if (bookedRooms + rooms > listing.totalRooms) {
                    const error = new Error(`Only ${Math.max(listing.totalRooms - bookedRooms, 0)} room(s) are available for those dates.`);
                    error.statusCode = 409;
                    throw error;
                }
                newBooking = new Booking({
                    listingId,
                    userId: req.user.userId,
                    checkIn: dates.start,
                    checkOut: dates.end,
                    rooms,
                    totalAmount: listing.price * rooms,
                });
                await newBooking.save({ session });
                await Listing.updateOne({ _id: listingId }, { $inc: { capacityVersion: 1 } }, { session });
            });
        } finally {
            await session.endSession();
        }
        res.status(201).json({ message: "Booking created successfully", booking: newBooking });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(error.statusCode || 500).json({ message: error.message || "Error creating booking" });
    }
});

router.get("/my-bookings", authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.userId }).populate("listingId");
        if (bookings.length === 0) {
            return res.status(200).json({ bookings: [], message: "You have no bookings yet." });
        }
        res.json({ bookings });
    } catch (error) {
        console.error("Error fetching my bookings:", error);
        res.status(500).json({ message: "Error fetching my bookings" });
    }
});

router.get("/dashboard", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const dates = parseDashboardDates(req.query.checkIn, req.query.checkOut);
        if (!dates) {
            return res.status(400).json({ message: "Provide both valid checkIn and checkOut dates, or omit both to use today." });
        }

        const listings = await Listing.find({ hostId: req.user.userId }).select("title location price totalRooms");
        const listingIds = listings.map((listing) => listing._id);
        const [activeBookings, paidBookings] = await Promise.all([
            Booking.find({
            listingId: { $in: listingIds },
                $or: [
                    { status: "confirmed" },
                    { status: "pending_payment", paymentStatus: "unpaid" },
                ],
                checkIn: { $lt: dates.end },
                checkOut: { $gt: dates.start },
            }).select("listingId rooms"),
            Booking.find({ listingId: { $in: listingIds }, status: "confirmed", paymentStatus: "paid" }).select("totalAmount currency rooms"),
        ]);

        const bookedByListing = new Map();
        for (const booking of activeBookings) {
            const key = booking.listingId.toString();
            bookedByListing.set(key, (bookedByListing.get(key) || 0) + booking.rooms);
        }

        const rooms = listings.map((listing) => {
            const booked = bookedByListing.get(listing._id.toString()) || 0;
            return {
                listingId: listing._id,
                title: listing.title,
                location: listing.location,
                totalRooms: listing.totalRooms,
                bookedRooms: booked,
                availableRooms: Math.max(listing.totalRooms - booked, 0),
            };
        });

        const revenueByCurrency = {};
        for (const booking of paidBookings) {
            const currency = (booking.currency || "ngn").toUpperCase();
            revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + booking.totalAmount;
        }

        res.json({
            period: { checkIn: dates.start, checkOut: dates.end },
            rooms,
            totals: {
                totalRooms: rooms.reduce((total, item) => total + item.totalRooms, 0),
                bookedRooms: rooms.reduce((total, item) => total + item.bookedRooms, 0),
                availableRooms: rooms.reduce((total, item) => total + item.availableRooms, 0),
                totalRevenue: revenueByCurrency,
                revenueByCurrency,
            },
        });
    } catch (error) {
        console.error("Error fetching booking dashboard:", error);
        res.status(500).json({ message: "Error fetching booking dashboard" });
    }
});

router.get("/admin-bookings", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { sortBy = "createdAt", order = "desc" } = req.query;
        const allowedSortFields = ["createdAt", "updatedAt", "checkIn", "checkOut"];
        if (!allowedSortFields.includes(sortBy) || !["asc", "desc"].includes(order)) {
            return res.status(400).json({ message: "Invalid booking sort options." });
        }

        const listingFilter = { hostId: req.user.userId };
        if (req.query.listingId) {
            if (!mongoose.isValidObjectId(req.query.listingId)) {
                return res.status(400).json({ message: "Invalid listing ID." });
            }
            listingFilter._id = req.query.listingId;
        }

        const listings = await Listing.find(listingFilter).select("title location price totalRooms");
        const listingIds = listings.map((listing) => listing._id);
        const bookingFilter = { listingId: { $in: listingIds } };

        if (req.query.status) {
            if (!["pending_payment", "confirmed", "cancelled"].includes(req.query.status)) {
                return res.status(400).json({ message: "Invalid booking status." });
            }
            bookingFilter.status = req.query.status;
        }

        const bookings = await Booking.find(bookingFilter)
            .populate("listingId", "title location price totalRooms")
            .populate("userId", "name email")
            .sort({ [sortBy]: order === "asc" ? 1 : -1 });

        res.json({ bookings, count: bookings.length });
    } catch (error) {
        console.error("Error fetching admin bookings:", error);
        res.status(500).json({ message: "Error fetching admin bookings" });
    }
});

//get a specific booking by id
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }
        const booking = await Booking.findById(req.params.id).populate("listingId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if(booking.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You can only view your own bookings." });
        }
        res.json({ booking });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ message: "Error fetching booking" });
    }
});

//update a booking by id
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }
        const { listingId, checkIn, checkOut } = req.body;
        const rooms = parseRooms(req.body.rooms);
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if(booking.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You can only update your own bookings." });
        }
        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Cancelled bookings cannot be updated." });
        }
        if (booking.paymentStatus === "paid" || booking.status === "confirmed") {
            return res.status(400).json({ message: "Paid or confirmed bookings cannot be edited. Cancel and create a new booking instead." });
        }
        if (!mongoose.isValidObjectId(listingId)) {
            return res.status(400).json({ message: "A valid listing ID is required." });
        }
        if (!rooms) {
            return res.status(400).json({ message: "Rooms must be a positive whole number." });
        }
        const dates = parseBookingDates(checkIn, checkOut);
        if (!dates) {
            return res.status(400).json({ message: "Check-out must be after check-in, using valid dates." });
        }
        let updatedBooking;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const listing = await Listing.findById(listingId).session(session);
                if (!listing) {
                    const error = new Error("Listing not found.");
                    error.statusCode = 404;
                    throw error;
                }
                const bookedRooms = await getBookedRooms(listingId, dates.start, dates.end, booking._id, session);
                if (bookedRooms + rooms > listing.totalRooms) {
                    const error = new Error(`Only ${Math.max(listing.totalRooms - bookedRooms, 0)} room(s) are available for those dates.`);
                    error.statusCode = 409;
                    throw error;
                }
                updatedBooking = await Booking.findByIdAndUpdate(
                    req.params.id,
                    { listingId, checkIn: dates.start, checkOut: dates.end, rooms, totalAmount: listing.price * rooms },
                    { new: true, runValidators: true, session }
                );
                await Listing.updateOne({ _id: listingId }, { $inc: { capacityVersion: 1 } }, { session });
            });
        } finally {
            await session.endSession();
        }
        res.json({ message: "Booking updated successfully", booking: updatedBooking });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(error.statusCode || 500).json({ message: error.message || "Error updating booking" });
    }
});

//delete a booking by id
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if(booking.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You can only delete your own bookings." });
        }
        if(booking.status === "cancelled") {
            return res.status(400).json({ message: "Booking is already cancelled." });
        }
        if (booking.paymentStatus === "paid") {
            return res.status(400).json({ message: "Paid bookings require a refund before cancellation." });
        }
        booking.status = "cancelled";
        await booking.save();
        res.json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: "Error deleting booking" });
    }
});

module.exports = router;