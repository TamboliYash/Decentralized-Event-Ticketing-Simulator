const jwt = require("jsonwebtoken");

/**
 * Auth middleware — verifies the JWT from the Authorization header.
 *
 * On success, attaches `req.user = { userId, role }` and calls next().
 * On failure, returns 401 with a distinct message for each failure mode:
 *   - missing header / malformed header
 *   - expired token
 *   - invalid / tampered token
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authentication required: no token provided" });
  }

  const token = header.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required: no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    // JsonWebTokenError, NotBeforeError, or anything else
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;
