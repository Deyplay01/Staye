const expresss  = require("express");
const router = expresss.Router();
const Profile = require("../models/profile");
const authMiddleware = require("../middleware/Authentication");

//to get the profile
router.get("/", authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ username: req.user.userId }).populate("username", "name email");
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.json({ profile });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
        const profileData = {...req.body, username: req.user.userId };
        const existingProfile = await Profile.findOne({ username: req.user.userId });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists" });
        }
        const profile = new Profile(profileData);
        await profile.save();
        res.status(201).json({ message: "Profile created successfully", profile });
    } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ message: "Error creating profile" });
    }
});

router.put("/", authMiddleware, async (req, res) => {
    try {
        const allowedFields = ["bio", "phone", "gender", "dob", "avatar", "location"];
        const updates = Object.fromEntries(
            allowedFields
                .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
                .map((field) => [field, req.body[field]])
        );
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "At least one profile field is required." });
        }
        const updatedProfile = await Profile.findOneAndUpdate(
            { username: req.user.userId },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!updatedProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.json({ message: "Profile updated successfully", profile: updatedProfile });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
});

// Delete the profile
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const deletedProfile = await Profile.findOneAndDelete({ username: req.user.userId });
        if (!deletedProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.json({ message: "Profile deleted successfully", profile: deletedProfile });
    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({ message: "Error deleting profile" });
    }
});

module.exports = router;
