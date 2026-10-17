const test = require("node:test");
const assert = require("node:assert/strict");
const { getUserRole, requireRoles } = require("../src/utils/roles");

test("role lookup supports the three roles and legacy admin records", () => {
    assert.equal(getUserRole({ role: "guest" }), "guest");
    assert.equal(getUserRole({ role: "host" }), "host");
    assert.equal(getUserRole({ role: "admin" }), "admin");
    assert.equal(getUserRole({ isAdmin: true }), "host");
    assert.equal(getUserRole({}), "guest");
});

test("host authorization does not grant super-admin privileges", () => {
    let nextCalled = false;
    let statusCode;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json() {
            return this;
        },
    };

    requireRoles("admin")({ user: { role: "host" } }, res, () => {
        nextCalled = true;
    });

    assert.equal(statusCode, 403);
    assert.equal(nextCalled, false);
});

test("super admins are allowed through super-admin authorization", () => {
    let nextCalled = false;
    requireRoles("admin")({ user: { role: "admin" } }, {}, () => {
        nextCalled = true;
    });
    assert.equal(nextCalled, true);
});
