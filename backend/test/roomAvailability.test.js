const assert = require("node:assert/strict");
const test = require("node:test");
const { lockRoomAvailability } = require("../src/utils/roomAvailability");

test("availability lock increments the room revision in the active transaction", async () => {
    const session = { id: "transaction" };
    let update;
    const Room = {
        async updateOne(filter, operation, options) {
            update = { filter, operation, options };
            return { matchedCount: 1 };
        },
    };

    await lockRoomAvailability(Room, "room-id", session);

    assert.deepEqual(update, {
        filter: { _id: "room-id" },
        operation: { $inc: { availabilityRevision: 1 } },
        options: { session },
    });
});

test("availability lock reports a missing room", async () => {
    const Room = { async updateOne() { return { matchedCount: 0 }; } };
    await assert.rejects(
        lockRoomAvailability(Room, "missing-room", {}),
        (error) => error.message === "Room category not found." && error.statusCode === 404,
    );
});
