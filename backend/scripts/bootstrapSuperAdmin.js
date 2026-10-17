const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function bootstrapSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!process.env.MONGODB_URI || !email || !password || password.length < 12) {
        throw new Error("Set MONGODB_URI, SUPER_ADMIN_EMAIL, and a SUPER_ADMIN_PASSWORD of at least 12 characters.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await mongoose.connection.collection("users").updateOne(
            { email },
            {
                $set: { role: "admin", status: "active", password: passwordHash },
                $setOnInsert: { email, name: email.split("@")[0], isFlagged: false, createdAt: new Date() },
                $unset: { isAdmin: "" },
            },
            { upsert: true },
        );
        console.log(result.upsertedCount ? "Super admin account created." : "Super admin account updated.");
    } finally {
        await mongoose.disconnect();
    }
}

bootstrapSuperAdmin().catch((error) => {
    console.error("Super admin bootstrap failed:", error.message);
    process.exitCode = 1;
});
