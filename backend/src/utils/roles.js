function getUserRole(user) {
    if (["guest", "host", "admin"].includes(user?.role)) return user.role;
    return user?.isAdmin ? "host" : "guest";
}

function requireRoles(...roles) {
    return function authorizeRole(req, res, next) {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. You do not have permission to perform this action." });
        }
        next();
    };
}

module.exports = { getUserRole, requireRoles };
