const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Booking = require("../src/models/Booking");
const { createBookingReference } = require("../src/utils/bookingReference");

dotenv.config();

async function migrateBookingReferences() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI must be configured.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const bookings = await Booking.find({
        $or: [{ publicReference: { $exists: false } }, { publicReference: null }],
    }).select("_id");

    let migrated = 0;
    for (const booking of bookings) {
        let publicReference;
        do {
            publicReference = createBookingReference();
        } while (await Booking.exists({ publicReference }));

        await Booking.collection.updateOne(
            { _id: booking._id },
            { $set: { publicReference } }
        );
        migrated += 1;
        console.log(`${booking._id} -> ${publicReference}`);
    }

    console.log(`Booking reference migration complete: ${migrated} booking(s) updated.`);
    await mongoose.disconnect();
}

migrateBookingReferences().catch(async (error) => {
    console.error("Booking reference migration failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});
