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

async function hasDateConflict(listingId, start, end, bookingId) {
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
    return Booking.exists(filter);
}

// Create a new booking
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { listingId, checkIn, checkOut } = req.body;
        if (!mongoose.isValidObjectId(listingId)) {
            return res.status(400).json({ message: "A valid listing ID is required." });
        }
        const dates = parseBookingDates(checkIn, checkOut);
        if (!dates) {
            return res.status(400).json({ message: "Check-out must be after check-in, using valid dates." });
        }
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }
        if (await hasDateConflict(listingId, dates.start, dates.end)) {
            return res.status(409).json({ message: "The listing is already booked for those dates." });
        }
        const newBooking = new Booking({
            listingId,
            userId: req.user.userId,
            checkIn: dates.start,
            checkOut: dates.end,
        });
        await newBooking.save();
        res.status(201).json({ message: "Booking created successfully", booking: newBooking });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking" });
    }
});

router.get("/my-bookings", authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.userId }).populate("listingId");
        res.json({ bookings });
    } catch (error) {
        console.error("Error fetching my bookings:", error);
        res.status(500).json({ message: "Error fetching my bookings" });
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
        if (!mongoose.isValidObjectId(listingId)) {
            return res.status(400).json({ message: "A valid listing ID is required." });
        }
        const dates = parseBookingDates(checkIn, checkOut);
        if (!dates) {
            return res.status(400).json({ message: "Check-out must be after check-in, using valid dates." });
        }
        if (!await Listing.exists({ _id: listingId })) {
            return res.status(404).json({ message: "Listing not found." });
        }
        if (await hasDateConflict(listingId, dates.start, dates.end, booking._id)) {
            return res.status(409).json({ message: "The listing is already booked for those dates." });
        }
        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, { listingId, checkIn: dates.start, checkOut: dates.end }, { new: true, runValidators: true });
        res.json({ message: "Booking updated successfully", booking: updatedBooking });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ message: "Error updating booking" });
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
        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Booking is already cancelled." });
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