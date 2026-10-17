const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Listing = require("../src/models/Listings");
const Room = require("../src/models/Room");

dotenv.config();

if (process.env.NODE_ENV !== "production") {
    const dns = require("dns");
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

async function migrateLegacyListings() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI must be configured.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const cursor = Listing.collection.find({});
        let migratedCount = 0;
        let skippedCount = 0;

        for await (const listing of cursor) {
            const roomCount = await Room.countDocuments({ listingId: listing._id });
            if (roomCount > 0) continue;

            const price = Number(listing.price);
            const totalRooms = Number(listing.totalRooms || 1);
            if (!Number.isFinite(price) || price < 0 || !Number.isInteger(totalRooms) || totalRooms < 1) {
                skippedCount += 1;
                console.error(`Skipped legacy listing ${listing._id}: invalid price or room count.`);
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
                { upsert: true },
            );
            migratedCount += 1;
        }

        console.log(`Legacy listing migration complete: ${migratedCount} migrated, ${skippedCount} skipped.`);
        if (skippedCount) process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

migrateLegacyListings().catch(async (error) => {
    console.error("Legacy listing migration failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});
