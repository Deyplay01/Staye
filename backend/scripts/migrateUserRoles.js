const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}


async function migrateUserRoles() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI must be configured.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const users = await mongoose.connection.collection("users").updateMany(
            {},
            [
                {
                    $set: {
                        role: { $ifNull: ["$role", { $cond: [{ $eq: ["$isAdmin", true] }, "host", "guest"] }] },
                        status: { $ifNull: ["$status", "active"] },
                        isFlagged: { $ifNull: ["$isFlagged", false] },
                    },
                },
                { $unset: "isAdmin" },
            ],
        );
        const listings = await mongoose.connection.collection("listings").updateMany(
            { status: { $exists: false } },
            { $set: { status: "approved", reviewReason: "", reviewedAt: null, reviewedBy: null } },
        );
        console.log(`Role migration complete: ${users.modifiedCount} user(s), ${listings.modifiedCount} listing(s) updated.`);
    } finally {
        await mongoose.disconnect();
    }
}

migrateUserRoles().catch((error) => {
    console.error("Role migration failed:", error);
    process.exitCode = 1;
});
