const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const Booking = require("../models/Booking");
const { User } = require("../models/User");
const authMiddleware = require("../middleware/Authentication");

const router = express.Router();
const paystack = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    },
});

function requirePaystack(res) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        res.status(503).json({ message: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to the backend environment." });
        return false;
    }
    return true;
}

router.post("/initialize", authMiddleware, async (req, res) => {
    try {
        if (!requirePaystack(res)) return;
        const { bookingId } = req.body;
        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "A valid booking ID is required." });
        }

        const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (booking.status === "cancelled") return res.status(400).json({ message: "Cancelled bookings cannot be paid for." });
        if (booking.paymentStatus === "paid") return res.status(400).json({ message: "Booking is already paid." });

        const user = await User.findById(req.user.userId).select("email");
        if (!user) return res.status(404).json({ message: "User not found." });

        const amount = Math.round(booking.totalAmount * 100);
        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ message: "Booking amount must be greater than zero." });
        }

        const currency = (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase();
        const reference = booking.paymentStatus === "failed"
            ? `booking_${booking._id}_${Date.now()}`
            : (booking.paymentReference || `booking_${booking._id}_${Date.now()}`);
        const response = await paystack.post("/transaction/initialize", {
            amount,
            email: user.email,
            currency,
            reference,
            ...(process.env.PAYSTACK_CALLBACK_URL ? { callback_url: process.env.PAYSTACK_CALLBACK_URL } : {}),
            metadata: { bookingId: booking._id.toString(), userId: req.user.userId.toString() },
        });

        if (!response.data.status) return res.status(502).json({ message: "Paystack could not initialize the transaction." });

        booking.paymentReference = response.data.data.reference;
        booking.currency = currency.toLowerCase();
        booking.paymentStatus = "unpaid";
        booking.status = "pending_payment";
        await booking.save();

        res.status(201).json({
            authorizationUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code,
            reference: response.data.data.reference,
            amount: booking.totalAmount,
            currency,
            message: "Paystack transaction initialized.",
        });
    } catch (error) {
        console.error("Error initializing Paystack transaction:", error.response?.data || error.message);
        const paystackMessage = error.response?.data?.message;
        const statusCode = error.response?.status === 400 || error.response?.status === 422 ? 409 : 502;
        res.status(statusCode).json({
            message: paystackMessage || "Unable to start payment. Please try again.",
        });
    }
});

router.post("/verify", authMiddleware, async (req, res) => {
    try {
        if (!requirePaystack(res)) return;
        const { bookingId, reference } = req.body;
        if (!mongoose.isValidObjectId(bookingId) || !reference) {
            return res.status(400).json({ message: "Booking ID and Paystack reference are required." });
        }

        const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (booking.paymentReference !== reference) return res.status(400).json({ message: "Paystack reference does not belong to this booking." });
        if (booking.status === "cancelled") return res.status(400).json({ message: "Cancelled bookings cannot be confirmed." });

        const response = await paystack.get(`/transaction/verify/${encodeURIComponent(reference)}`);
        const transaction = response.data.data;
        if (!response.data.status || !transaction || transaction.reference !== booking.paymentReference) {
            return res.status(400).json({ message: "Paystack transaction verification failed." });
        }
        if (transaction.amount !== Math.round(booking.totalAmount * 100)
            || transaction.currency?.toLowerCase() !== booking.currency?.toLowerCase()) {
            return res.status(400).json({ message: "Payment amount or currency does not match the booking." });
        }

        if (transaction.status === "success") {
            booking.paymentStatus = "paid";
            booking.status = "confirmed";
        } else if (["failed", "abandoned"].includes(transaction.status)) {
            booking.paymentStatus = "failed";
            await booking.save();
            return res.status(402).json({ message: `Payment is not complete: ${transaction.status}.`, booking });
        } else {
            return res.status(202).json({ message: `Payment is still processing: ${transaction.status}.`, booking });
        }

        await booking.save();
        res.json({ message: "Paystack payment verified.", booking });
    } catch (error) {
        console.error("Error verifying Paystack transaction:", error.response?.data || error.message);
        res.status(502).json({
            message: error.response?.data?.message || "Unable to verify payment. Please try again.",
        });
    }
});

router.post("/refund", authMiddleware, async (req, res) => {
    try {
        if (!requirePaystack(res)) return;
        const { bookingId } = req.body;
        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "A valid booking ID is required." });
        }

        const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (booking.paymentStatus !== "paid" || !booking.paymentReference) {
            return res.status(400).json({ message: "Only paid bookings with a payment reference can be refunded." });
        }
        if (booking.status === "cancelled" && booking.paymentStatus === "refunded") {
            return res.status(400).json({ message: "Booking has already been refunded." });
        }

        const response = await paystack.post("/refund", { transaction: booking.paymentReference });
        if (!response.data.status) {
            return res.status(502).json({ message: response.data.message || "Paystack could not process the refund." });
        }

        booking.paymentStatus = "refunded";
        booking.status = "cancelled";
        await booking.save();
        res.json({ message: "Payment refunded and booking cancelled.", booking });
    } catch (error) {
        console.error("Error refunding payment:", error.response?.data || error.message);
        res.status(error.response?.status === 400 ? 409 : 502).json({
            message: error.response?.data?.message || "Unable to refund payment. Please try again.",
        });
    }
});

async function handleWebhook(req, res) {
    if (!process.env.PAYSTACK_SECRET_KEY) return res.status(503).json({ message: "Paystack is not configured." });

    if (!Buffer.isBuffer(req.body)) return res.status(400).json({ message: "Invalid webhook body." });
    const signature = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(req.body)
        .digest("hex");
    const receivedSignature = req.headers["x-paystack-signature"];
    const expectedBuffer = Buffer.from(signature, "utf8");
    const receivedBuffer = Buffer.from(receivedSignature || "", "utf8");
    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        return res.status(401).json({ message: "Invalid Paystack webhook signature." });
    }

    let event;
    try {
        event = JSON.parse(req.body.toString("utf8"));
    } catch {
        return res.status(400).json({ message: "Invalid webhook JSON." });
    }
    if (event.event === "charge.success" && event.data?.reference) {
        const booking = await Booking.findOne({ paymentReference: event.data.reference, status: "pending_payment" });
        if (booking) {
            const metadata = event.data.metadata || {};
            const validPayment = event.data.amount === Math.round(booking.totalAmount * 100)
                && event.data.currency?.toLowerCase() === booking.currency?.toLowerCase()
                && (!metadata.bookingId || metadata.bookingId === booking._id.toString());
            if (!validPayment) return res.status(400).json({ message: "Webhook payment does not match the booking." });
            booking.paymentStatus = "paid";
            booking.status = "confirmed";
            await booking.save();
        }
    }

    res.json({ received: true });
}

module.exports = router;
module.exports.handleWebhook = handleWebhook;
