/**
 * Role-based authorization middleware factory.
 *
 * Usage:  router.get("/admin-only", auth, roleMiddleware("admin"), handler)
 *
 * Returns 401 if req.user is missing (guards against being mounted without
 * the auth middleware upstream — a coding mistake, not a user error, but
 * we must never crash or leak info).
 *
 * Returns 403 if the authenticated user's role is not in `allowedRoles`.
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    // Safety net: if someone mounts this without auth middleware first,
    // req.user will be undefined. Return 401 instead of crashing.
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Authentication required: no user context" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
}

module.exports = roleMiddleware;
