const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Booking = require("../models/Booking");
const Listing = require("../models/Listings");
const Room = require("../models/Room");
const authMiddleware = require("../middleware/Authentication");
const { createNotification } = require("../utils/notifications");

function parseBookingDates(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!checkIn || !checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        return null;
    }
    return { start, end };
}

function getNightCount(start, end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.round((end - start) / msPerDay));
}

async function getBookedRooms(roomId, start, end, bookingId, session) {
    const filter = {
        roomId,
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

function isAllTimeDashboard(req) {
    return req.query.period === "all";
}

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { listingId, roomId, checkIn, checkOut } = req.body;
        const rooms = parseRooms(req.body.rooms);

        if (!mongoose.isValidObjectId(listingId)) {
            return res.status(400).json({ message: "A valid listing ID is required." });
        }
        if (!mongoose.isValidObjectId(roomId)) {
            return res.status(400).json({ message: "A valid room ID is required." });
        }
        if (!rooms) {
            return res.status(400).json({ message: "Rooms must be a positive whole number." });
        }

        const dates = parseBookingDates(checkIn, checkOut);
        if (!dates) {
            return res.status(400).json({ message: "Check-out must be after check-in, using valid dates." });
        }

        let newBooking;
        let notificationData;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const listing = await Listing.findById(listingId).session(session);
                if (!listing) {
                    const error = new Error("Listing not found.");
                    error.statusCode = 404;
                    throw error;
                }

                const room = await Room.findById(roomId).session(session);
                if (!room) {
                    const error = new Error("Room category not found.");
                    error.statusCode = 404;
                    throw error;
                }
                if (room.listingId.toString() !== listingId) {
                    const error = new Error("This room does not belong to the selected listing.");
                    error.statusCode = 400;
                    throw error;
                }

                const existingUserBooking = await Booking.findOne({
                    listingId,
                    roomId,
                    userId: req.user.userId,
                    $or: [
                        { status: "confirmed" },
                        { status: "pending_payment", paymentStatus: "unpaid" },
                    ],
                    checkIn: { $lt: dates.end },
                    checkOut: { $gt: dates.start },
                }).session(session);

                if (existingUserBooking) {
                    const error = new Error("You already have an active booking for this room during those dates.");
                    error.statusCode = 409;
                    throw error;
                }

                const bookedRooms = await getBookedRooms(roomId, dates.start, dates.end, undefined, session);
                if (bookedRooms + rooms > room.totalRooms) {
                    const error = new Error(`Only ${Math.max(room.totalRooms - bookedRooms, 0)} room(s) are available for those dates.`);
                    error.statusCode = 409;
                    throw error;
                }

                const nights = getNightCount(dates.start, dates.end);
                newBooking = new Booking({
                    listingId,
                    roomId,
                    userId: req.user.userId,
                    checkIn: dates.start,
                    checkOut: dates.end,
                    rooms,
                    totalAmount: room.price * rooms * nights,
                });
                await newBooking.save({ session });
                notificationData = {
                    hostId: listing.hostId,
                    listingTitle: listing.title,
                    roomName: room.name,
                };
            });
        } finally {
            await session.endSession();
        }
        await Promise.all([
            createNotification({
                userId: req.user.userId,
                type: "booking_created",
                title: "Booking created",
                message: `${notificationData.listingTitle} · ${notificationData.roomName} is awaiting payment.`,
                bookingId: newBooking._id,
                listingId,
            }),
            createNotification({
                userId: notificationData.hostId,
                type: "booking_received",
                title: "New booking received",
                message: `${notificationData.listingTitle} has a new ${notificationData.roomName} booking awaiting payment.`,
                bookingId: newBooking._id,
                listingId,
            }),
        ]);
        res.status(201).json({ message: "Booking created successfully", booking: newBooking });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(error.statusCode || 500).json({ message: error.message || "Error creating booking" });
    }
});

router.get("/my-bookings", authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.userId }).populate("listingId").populate("roomId");
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
        const allTime = isAllTimeDashboard(req);
        const periodFilter = allTime
            ? {}
            : {
                $or: [
                    { createdAt: { $gte: dates.start, $lt: dates.end } },
                    { createdAt: { $exists: false }, checkIn: { $gte: dates.start, $lt: dates.end } },
                ],
            };

        const listings = await Listing.find({ hostId: req.user.userId }).select("title location");
        const listingIds = listings.map((listing) => listing._id);
        const roomCategories = await Room.find({ listingId: { $in: listingIds } });
        const roomIds = roomCategories.map((room) => room._id);

        const [activeBookings, paidBookings, bookedRoomBookings, periodBookings] = await Promise.all([
            Booking.find({
                roomId: { $in: roomIds },
                $or: [
                    { status: "confirmed" },
                    { status: "pending_payment", paymentStatus: "unpaid" },
                ],
                checkIn: { $lt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
                checkOut: { $gt: new Date() },
            }).select("roomId rooms"),
            Booking.find({
                roomId: { $in: roomIds },
                status: "confirmed",
                paymentStatus: "paid",
                ...periodFilter,
            }).select("totalAmount currency rooms")
            ,
            Booking.find({
                roomId: { $in: roomIds },
                status: "confirmed",
                ...periodFilter,
            }).select("rooms")
            ,
            Booking.find({
                roomId: { $in: roomIds },
                ...periodFilter,
            }).select("status")
        ]);

        const bookedByRoom = new Map();
        for (const booking of activeBookings) {
            const key = booking.roomId.toString();
            bookedByRoom.set(key, (bookedByRoom.get(key) || 0) + booking.rooms);
        }

        const rooms = roomCategories.map((room) => {
            const listing = listings.find((item) => item._id.toString() === room.listingId.toString());
            const booked = bookedByRoom.get(room._id.toString()) || 0;
            return {
                roomId: room._id,
                listingId: room.listingId,
                title: listing?.title || room.name,
                roomName: room.name,
                price: room.price,
                location: listing?.location || "",
                totalRooms: room.totalRooms,
                bookedRooms: booked,
                availableRooms: Math.max(room.totalRooms - booked, 0),
            };
        });

        const revenueByCurrency = {};
        for (const booking of paidBookings) {
            const currency = (booking.currency || "ngn").toUpperCase();
            revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + booking.totalAmount;
        }
        const bookedRooms = bookedRoomBookings.reduce((total, booking) => total + booking.rooms, 0);
        const confirmedBookings = periodBookings.filter((booking) => booking.status === "confirmed").length;
        const cancelledBookings = periodBookings.filter((booking) => booking.status === "cancelled").length;
        const pendingBookings = periodBookings.filter((booking) => booking.status === "pending_payment").length;

        res.json({
            period: { type: allTime ? "all" : "range", checkIn: dates.start, checkOut: dates.end },
            rooms,
            totals: {
                totalRooms: rooms.reduce((total, item) => total + item.totalRooms, 0),
                bookedRooms,
                confirmedBookings,
                cancelledBookings,
                pendingBookings,
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

        const listings = await Listing.find(listingFilter).select("_id");
        const listingIds = listings.map((listing) => listing._id);
        const bookingFilter = { listingId: { $in: listingIds } };

        if (req.query.status) {
            if (!["pending_payment", "confirmed", "cancelled"].includes(req.query.status)) {
                return res.status(400).json({ message: "Invalid booking status." });
            }
            bookingFilter.status = req.query.status;
        }

        const bookings = await Booking.find(bookingFilter)
            .populate("listingId", "title location")
            .populate("roomId", "name price")
            .populate("userId", "name email")
            .sort({ [sortBy]: order === "asc" ? 1 : -1 });

        res.json({ bookings, count: bookings.length });
    } catch (error) {
        console.error("Error fetching admin bookings:", error);
        res.status(500).json({ message: "Error fetching admin bookings" });
    }
});

router.get("/admin-bookings/:id/verify", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const requestedReference = String(req.params.id || "").trim();
        const isPublicReference = /^STY-[A-F0-9]{18}$/i.test(requestedReference);
        const isLegacyId = mongoose.isValidObjectId(requestedReference);
        if (!isPublicReference && !isLegacyId) {
            return res.status(400).json({
                code: "INVALID_REFERENCE_",
                message: "Enter a valid booking reference",
                verified: false,
            });
        }
        const bookingLookup = isLegacyId
            ? { $or: [{ publicReference: requestedReference.toUpperCase() }, { _id: requestedReference }] }
            : { publicReference: requestedReference.toUpperCase() };
        const booking = await Booking.findOne(bookingLookup)
            .populate("listingId", "title location hostId")
            .populate("roomId", "name price totalRooms")
            .populate("userId", "name email");

        if (!booking) {
            return res.status(404).json({ code: "BOOKING_NOT_FOUND", message: "No booking found.", verified: false });
        }
        if (!booking.listingId || booking.listingId.hostId.toString() !== req.user.userId) {
            return res.status(403).json({ code: "REFERENCE_NOT_OWNED", message: "This booking does not belong to one of your listings.", verified: false });
        }

        const paymentVerified = booking.paymentStatus === "paid" && Boolean(booking.paymentReference);
        const bookingConfirmed = booking.status === "confirmed";
        const isExpired = new Date(booking.checkOut).getTime() <= Date.now();
        let verificationStatus = "VALID";
        if (booking.status === "cancelled") verificationStatus = "CANCELLED";
        else if (booking.paymentStatus === "refunded") verificationStatus = "REFUNDED";
        else if (isExpired) verificationStatus = "EXPIRED";
        else if (booking.paymentStatus === "failed") verificationStatus = "PAYMENT_FAILED";
        else if (booking.paymentStatus !== "paid") verificationStatus = "PAYMENT_UNPAID";
        else if (!booking.paymentReference) verificationStatus = "PAYMENT_REFERENCE_MISSING";
        else if (!bookingConfirmed) verificationStatus = "NOT_CONFIRMED";
        const isValid = verificationStatus === "VALID";

        res.json({
            verified: true,
            isValid,
            verificationStatus,
            checks: {
                bookingExists: true,
                listingOwnedByAdmin: true,
                paymentVerified,
                bookingConfirmed,
                cancelled: booking.status === "cancelled",
                expired: isExpired,
            },
            booking,
        });
    } catch (error) {
        console.error("Error verifying admin booking:", error);
        res.status(500).json({ message: "Could not verify this booking." });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }
        const booking = await Booking.findById(req.params.id)
            .populate("listingId")
            .populate("roomId")
            .populate("userId", "name email");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.userId?._id?.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You can only view your own bookings." });
        }
        res.json({ booking });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ message: "Error fetching booking" });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }
        const { listingId, roomId, checkIn, checkOut } = req.body;
        const rooms = parseRooms(req.body.rooms);
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You can only update your own bookings." });
        }
        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Cancelled bookings cannot be updated." });
        }
        if (booking.paymentStatus === "paid" || booking.status === "confirmed") {
            return res.status(400).json({ message: "Paid or confirmed bookings cannot be edited. Cancel and create a new booking instead." });
        }
        if (!mongoose.isValidObjectId(listingId) || !mongoose.isValidObjectId(roomId)) {
            return res.status(400).json({ message: "A valid listing ID and room ID are required." });
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

                const room = await Room.findById(roomId).session(session);
                if (!room || room.listingId.toString() !== listingId) {
                    const error = new Error("The chosen room does not belong to this listing.");
                    error.statusCode = 400;
                    throw error;
                }

                const bookedRooms = await getBookedRooms(roomId, dates.start, dates.end, booking._id, session);
                if (bookedRooms + rooms > room.totalRooms) {
                    const error = new Error(`Only ${Math.max(room.totalRooms - bookedRooms, 0)} room(s) are available for those dates.`);
                    error.statusCode = 409;
                    throw error;
                }
                const nights = getNightCount(dates.start, dates.end);
                updatedBooking = await Booking.findByIdAndUpdate(
                    req.params.id,
                    { listingId, roomId, checkIn: dates.start, checkOut: dates.end, rooms, totalAmount: room.price * rooms * nights },
                    { new: true, runValidators: true, session }
                );
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

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You can only delete your own bookings." });
        }
        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Booking is already cancelled." });
        }
        if (booking.paymentStatus === "paid") {
            return res.status(400).json({ message: "Paid bookings require a refund before cancellation." });
        }
        booking.status = "cancelled";
        await booking.save();
        const listing = await Listing.findById(booking.listingId).select("hostId title");
        const cancellationNotifications = [
            createNotification({
                userId: booking.userId,
                type: "booking_cancelled",
                title: "Booking cancelled",
                message: "Your booking has been cancelled.",
                bookingId: booking._id,
                listingId: booking.listingId,
            }),
        ];
        if (listing && listing.hostId.toString() !== booking.userId.toString()) {
            cancellationNotifications.push(createNotification({
                userId: listing.hostId,
                type: "booking_cancelled",
                title: "Booking cancelled",
                message: `${listing.title} has had a booking cancelled by the guest.`,
                bookingId: booking._id,
                listingId: booking.listingId,
            }));
        }
        await Promise.all(cancellationNotifications);
        res.json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: "Error deleting booking" });
    }
});

module.exports = router;