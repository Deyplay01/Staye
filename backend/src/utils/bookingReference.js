const crypto = require("crypto");

function createBookingReference() {
    return `STY-${crypto.randomBytes(9).toString("hex").toUpperCase()}`;
}

module.exports = { createBookingReference };
