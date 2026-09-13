const express = require("express");
const router = express.Router();
const Listing = require("../models/Listings");
const authMiddleware = require("../middleware/Authentication");

router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, location, priceMin, priceMax, amenities, sortBy = "createdAt", order = "desc" } = req.query;
        const allowedSortFields = ["createdAt", "updatedAt", "price", "title"];
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
        const filter = {}; 

        if (location) {
            filter.location = { $regex: location, $options: "i" }; 
        }

        if (priceMin || priceMax) {
            filter.price = {};
            if (minimumPrice !== undefined) filter.price.$gte = minimumPrice;
            if (maximumPrice !== undefined) filter.price.$lte = maximumPrice;
        }

        if (amenities) {
            const requestedAmenities = String(amenities).split(",").map((item) => item.trim()).filter(Boolean);
            if (requestedAmenities.length) filter.amenities = { $all: requestedAmenities };
        }

        const listings = await Listing.find(filter)
            .sort({ [sortBy]: order === "asc" ? 1 : -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
            res.json({ listings, page: pageNumber, limit: limitNumber });
    } catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/my-listings", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const { location, sortBy = "createdAt", order = "desc" } = req.query;
        const allowedSortFields = ["createdAt", "updatedAt", "price", "title"];
        if (!allowedSortFields.includes(sortBy) || !["asc", "desc"].includes(order)) {
            return res.status(400).json({ message: "Invalid listing sort options." });
        }
        const filter = { hostId: req.user.userId };
        if (location) filter.location = { $regex: location, $options: "i" };
        const myListings = await Listing.find(filter).sort({ [sortBy]: order === "asc" ? 1 : -1 });
        res.json({ listings: myListings });
    } catch (error) {
        console.error("Error fetching my listings:", error);
        res.status(500).json({ message: "Error fetching my listings" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        if (!require("mongoose").isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid listing ID." });
        }
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        res.json(listing);
    } catch (error) {
        console.error("Error fetching listing:", error);
        res.status(500).json({ message: "Error fetching listing" });
    }
});

// Create a new listing (requires authentication)
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const { title, description, price, location, images, amenities, totalRooms } = req.body;
        const newListing = new Listing({ title, description, price, location, images, amenities, totalRooms, hostId: req.user.userId });
        await newListing.save();
        res.status(201).json({ message: "Listing created successfully", listing: newListing });
    } catch (error) {
        console.error("Error creating listing:", error);
        res.status(500).json({ message: "Error creating listing" });
    }
});

// Update a listing (requires authentication)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        if (!require("mongoose").isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid listing ID." });
        }
        const { title, description, price, location, images, amenities, totalRooms } = req.body;
        const updatedListing = await Listing.findByIdAndUpdate(
            { _id: req.params.id, hostId: req.user.userId },
            { $set: { title, description, price, location, images, amenities, totalRooms } },
            { new: true, runValidators: true }
        );
        if (!updatedListing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        res.json({ message: "Listing updated successfully", listing: updatedListing });
    } catch (error) {
        console.error("Error updating listing:", error);
        res.status(500).json({ message: "Error updating listing" });
    }
});

// Delete a listing (requires authentication)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        if (!require("mongoose").isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid listing ID." });
        }
        const deletedListing = await Listing.findOneAndDelete({ _id: req.params.id, hostId: req.user.userId });
        if (!deletedListing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        res.json({ message: "Listing deleted successfully" });
    } catch (error) {
        console.error("Error deleting listing:", error);
        res.status(500).json({ message: "Error deleting listing" });
    }
});

module.exports = router;