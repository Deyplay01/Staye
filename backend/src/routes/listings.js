const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Listing = require("../models/Listings");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/Authentication");
const { requireRoles } = require("../utils/roles");

function normalizeRoomPayloads(payload) {
    if (!Array.isArray(payload) || payload.length === 0) {
        throw new Error("At least one room category is required.");
    }

    return payload.map((room, index) => {
        const name = String(room?.name || "").trim();
        const price = Number(room?.price);
        const totalRooms = Number(room?.totalRooms);
        if (!name) {
            throw new Error(`Room ${index + 1} needs a name.`);
        }
        if (!Number.isFinite(price) || price < 0) {
            throw new Error(`Room "${name}" has an invalid price.`);
        }
        if (!Number.isInteger(totalRooms) || totalRooms < 1) {
            throw new Error(`Room "${name}" must include at least 1 room.`);
        }

        return {
            name,
            description: String(room?.description || ""),
            price,
            totalRooms,
            images: Array.isArray(room?.images) ? room.images.filter(Boolean) : [],
            amenities: Array.isArray(room?.amenities)
                ? room.amenities.map((item) => String(item).trim()).filter(Boolean)
                : [],
        };
    });
}

async function enrichListings(listings) {
    if (!listings.length) return [];

    const listingIds = listings.map((listing) => listing._id);
    const rooms = await Room.find({ listingId: { $in: listingIds } }).sort({ price: 1, name: 1 });
    const roomsByListing = new Map();

    for (const room of rooms) {
        const key = room.listingId.toString();
        if (!roomsByListing.has(key)) roomsByListing.set(key, []);
        roomsByListing.get(key).push(room.toObject());
    }

    return listings.map((listing) => {
        const result = listing.toObject();
        if (result.hostId && typeof result.hostId === "object") {
            result.hostId = result.hostId._id;
        }
        return {
            ...result,
            rooms: roomsByListing.get(listing._id.toString()) || [],
        };
    });
}

router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, location, priceMin, priceMax, amenities, roomType, sortBy = "createdAt", order = "desc" } = req.query;
        const allowedSortFields = ["createdAt", "updatedAt", "title", "price"];
        if (!allowedSortFields.includes(sortBy) || !["asc", "desc"].includes(order)) {
            return res.status(400).json({ message: "Invalid listing sort options." });
        }

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const minimumPrice = priceMin === undefined ? undefined : Number(priceMin);
        const maximumPrice = priceMax === undefined ? undefined : Number(priceMax);
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 50) {
            return res.status(400).json({ message: "Page must be positive and limit must be between 1 and 50." });
        }
        if ((priceMin !== undefined && !Number.isFinite(minimumPrice)) || (priceMax !== undefined && !Number.isFinite(maximumPrice)) || (minimumPrice !== undefined && maximumPrice !== undefined && minimumPrice > maximumPrice)) {
            return res.status(400).json({ message: "Invalid price range." });
        }

        const filter = { status: "approved" };
        if (location) filter.location = { $regex: location, $options: "i" };
        const listings = await Listing.find(filter)
            .populate({ path: "hostId", match: { status: { $ne: "blocked" } }, select: "_id" })
            .sort({ [sortBy]: order === "asc" ? 1 : -1 });
        const visibleListings = listings.filter((listing) => listing.hostId);
        const enrichedListings = await enrichListings(visibleListings);

        const requestedAmenities = amenities
            ? String(amenities).split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
            : [];
        const filteredListings = enrichedListings.filter((listing) => {
            const matchingRooms = roomType
                ? listing.rooms.filter((room) => room.name.toLowerCase().includes(String(roomType).trim().toLowerCase()))
                : listing.rooms;
            if (!matchingRooms.length) return false;

            const listingAmenities = [...(listing.amenities || []), ...listing.rooms.flatMap((room) => room.amenities || [])]
                .map((item) => String(item).toLowerCase());
            if (requestedAmenities.some((amenity) => !listingAmenities.includes(amenity))) return false;

            const prices = matchingRooms.map((room) => Number(room.price)).filter((value) => Number.isFinite(value));
            if (!prices.length) return false;
            const minimumListingPrice = Math.min(...prices);
            const maximumListingPrice = Math.max(...prices);
            if (minimumPrice !== undefined && maximumListingPrice < minimumPrice) return false;
            if (maximumPrice !== undefined && minimumListingPrice > maximumPrice) return false;
            return true;
        });

        if (sortBy === "price") {
            filteredListings.sort((first, second) => {
                const firstPrice = Math.min(...first.rooms.map((room) => Number(room.price)).filter((value) => Number.isFinite(value)));
                const secondPrice = Math.min(...second.rooms.map((room) => Number(room.price)).filter((value) => Number.isFinite(value)));
                return order === "asc" ? firstPrice - secondPrice : secondPrice - firstPrice;
            });
        }

        const startIndex = (pageNumber - 1) * limitNumber;
        const paginated = filteredListings.slice(startIndex, startIndex + limitNumber);

        res.json({ listings: paginated, page: pageNumber, limit: limitNumber });
    } catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/popular-locations", async (_req, res) => {
    try {
        const popularLocations = await Booking.aggregate([
            { $match: { status: "confirmed", paymentStatus: "paid" } },
            { $lookup: { from: "listings", localField: "listingId", foreignField: "_id", as: "listing" } },
            { $unwind: "$listing" },
            { $match: { "listing.status": "approved" } },
            { $lookup: { from: "users", localField: "listing.hostId", foreignField: "_id", as: "host" } },
            { $unwind: "$host" },
            { $match: { "host.status": { $ne: "blocked" } } },
            {
                $group: {
                    _id: "$listing.location",
                    bookingCount: { $sum: 1 },
                    listingId: { $first: "$listing._id" },
                    listingTitle: { $first: "$listing.title" },
                    image: { $first: { $arrayElemAt: ["$listing.images", 0] } },
                },
            },
            { $sort: { bookingCount: -1, _id: 1 } },
            { $limit: 6 },
            {
                $project: {
                    _id: 0,
                    location: "$_id",
                    bookingCount: 1,
                    listingId: 1,
                    listingTitle: 1,
                    image: 1,
                },
            },
        ]);

        if (popularLocations.length) {
            return res.json({ locations: popularLocations });
        }

        const fallbackListings = await Listing.find({ status: "approved", location: { $exists: true, $ne: "" } })
            .populate({ path: "hostId", match: { status: { $ne: "blocked" } }, select: "_id" })
            .select("title location images")
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
        const fallbackLocations = [];
        const seenLocations = new Set();
        for (const listing of fallbackListings) {
            if (!listing.hostId) continue;
            if (seenLocations.has(listing.location)) continue;
            seenLocations.add(listing.location);
            fallbackLocations.push({
                location: listing.location,
                bookingCount: 0,
                listingId: listing._id,
                listingTitle: listing.title,
                image: listing.images?.[0] || null,
            });
            if (fallbackLocations.length === 6) break;
        }
        res.json({ locations: fallbackLocations });
    } catch (error) {
        console.error("Error fetching popular locations:", error);
        res.status(500).json({ message: "Could not load popular locations." });
    }
});

router.get("/my-listings", authMiddleware, async (req, res) => {
    try {
        if (!["host", "admin"].includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. Hosts only." });
        }
        const { location, sortBy = "createdAt", order = "desc" } = req.query;
        const allowedSortFields = ["createdAt", "updatedAt", "title"];
        if (!allowedSortFields.includes(sortBy) || !["asc", "desc"].includes(order)) {
            return res.status(400).json({ message: "Invalid listing sort options." });
        }
        const filter = { hostId: req.user.userId };
        if (location) filter.location = { $regex: location, $options: "i" };

        const myListings = await Listing.find(filter).sort({ [sortBy]: order === "asc" ? 1 : -1 });
        const enrichedListings = await enrichListings(myListings);
        res.json({ listings: enrichedListings });
    } catch (error) {
        console.error("Error fetching my listings:", error);
        res.status(500).json({ message: "Error fetching my listings" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid listing ID." });
        }
        const listing = await Listing.findOne({ _id: req.params.id, status: "approved" })
            .populate({ path: "hostId", match: { status: { $ne: "blocked" } }, select: "_id" });
        if (!listing || !listing.hostId) {
            return res.status(404).json({ message: "Listing not found" });
        }
        const [enrichedListing] = await enrichListings([listing]);
        res.json(enrichedListing);
    } catch (error) {
        console.error("Error fetching listing:", error);
        res.status(500).json({ message: "Error fetching listing" });
    }
});

router.post("/", authMiddleware, requireRoles("host", "admin"), async (req, res) => {
    try {
        const { title, description, location, images, amenities, rooms } = req.body;
        if (!title || !description || !location) {
            return res.status(400).json({ message: "Title, description, and location are required." });
        }

        const normalizedRooms = normalizeRoomPayloads(rooms);
        const newListing = new Listing({
            title,
            description,
            location,
            images: Array.isArray(images) ? images.filter(Boolean) : [],
            amenities: Array.isArray(amenities) ? amenities.map((item) => String(item).trim()).filter(Boolean) : [],
            hostId: req.user.userId,
        });

        await newListing.save();
        const createdRooms = await Room.insertMany(
            normalizedRooms.map((room) => ({
                ...room,
                listingId: newListing._id,
            }))
        );

        res.status(201).json({
            message: "Listing created successfully",
            listing: {
                ...newListing.toObject(),
                rooms: createdRooms,
            },
        });
    } catch (error) {
        console.error("Error creating listing:", error);
        res.status(400).json({ message: error.message || "Error creating listing" });
    }
});

router.put("/:id", authMiddleware, requireRoles("host", "admin"), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid listing ID." });
        }

        const { title, description, location, images, amenities, rooms } = req.body;
        if (!title || !description || !location) {
            return res.status(400).json({ message: "Title, description, and location are required." });
        }

        const normalizedRooms = normalizeRoomPayloads(rooms);
        const currentListing = await Listing.findOne({ _id: req.params.id, hostId: req.user.userId });
        if (!currentListing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const nextImages = Array.isArray(images) ? images.filter(Boolean) : [];
        const nextAmenities = Array.isArray(amenities) ? amenities.map((item) => String(item).trim()).filter(Boolean) : [];
        const contentChanged = title !== currentListing.title
            || description !== currentListing.description
            || location !== currentListing.location
            || JSON.stringify(nextImages) !== JSON.stringify(currentListing.images || [])
            || JSON.stringify(nextAmenities) !== JSON.stringify(currentListing.amenities || []);
        const updates = {
            title,
            description,
            location,
            images: nextImages,
            amenities: nextAmenities,
        };
        if (contentChanged) {
            updates.status = "pending_review";
            updates.reviewReason = "";
            updates.reviewedAt = null;
            updates.reviewedBy = null;
        }

        const updatedListing = await Listing.findOneAndUpdate(
            { _id: req.params.id, hostId: req.user.userId },
            {
                $set: updates,
            },
            { new: true, runValidators: true }
        );

        if (!updatedListing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        await Room.deleteMany({ listingId: updatedListing._id });
        const createdRooms = await Room.insertMany(
            normalizedRooms.map((room) => ({
                ...room,
                listingId: updatedListing._id,
            }))
        );

        res.json({
            message: "Listing updated successfully",
            listing: {
                ...updatedListing.toObject(),
                rooms: createdRooms,
            },
        });
    } catch (error) {
        console.error("Error updating listing:", error);
        res.status(400).json({ message: error.message || "Error updating listing" });
    }
});

router.delete("/:id", authMiddleware, requireRoles("host", "admin"), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid listing ID." });
        }
        const deletedListing = await Listing.findOneAndDelete({ _id: req.params.id, hostId: req.user.userId });
        if (!deletedListing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        await Room.deleteMany({ listingId: deletedListing._id });
        res.json({ message: "Listing deleted successfully" });
    } catch (error) {
        console.error("Error deleting listing:", error);
        res.status(500).json({ message: "Error deleting listing" });
    }
});

module.exports = router;