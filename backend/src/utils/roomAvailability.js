async function lockRoomAvailability(Room, roomId, session) {
    // A shared room-document write makes overlapping booking transactions conflict and retry.
    const result = await Room.updateOne(
        { _id: roomId },
        { $inc: { availabilityRevision: 1 } },
        { session },
    );
    if (result.matchedCount !== 1) {
        const error = new Error("Room category not found.");
        error.statusCode = 404;
        throw error;
    }
}

module.exports = { lockRoomAvailability };
