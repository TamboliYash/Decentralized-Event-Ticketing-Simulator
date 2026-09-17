/**
 * Central error-handling middleware.
 * Must be mounted LAST (after all routes) so Express routes thrown/next'd
 * errors here.  Four-parameter signature is required by Express.
 *
 * Error mapping:
 *   Mongoose ValidationError  → 400 with field-level detail
 *   Mongoose CastError (ObjectId) → 400
 *   Duplicate key (code 11000) → 409
 *   JWT errors                 → 401
 *   Explicit err.status        → that status
 *   Everything else            → 500 (stack never leaked in production)
 */
function errorMiddleware(err, _req, res, _next) {
  // ── Mongoose ValidationError → 400 with per-field messages ──
  if (err.name === "ValidationError") {
    const fields = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      fields[field] = detail.message;
    }
    return res.status(400).json({ error: "Validation failed", fields });
  }

  // ── Mongoose CastError (e.g. invalid ObjectId) → 400 ──
  if (err.name === "CastError") {
    return res.status(400).json({
      error: `Invalid ${err.kind}: "${err.value}" for ${err.path}`,
    });
  }

  // ── Mongoose / MongoDB duplicate-key → 409 ──
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(", ");
    return res.status(409).json({ error: `Duplicate value for: ${field}` });
  }

  // ── JWT errors → 401 ──
  if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // ── Explicit status set by controllers (e.g. err.status = 404) ──
  const status = err.status || err.statusCode || 500;

  // Always log the full error server-side for debugging
  if (status >= 500) {
    console.error("Unhandled error:", err);
  }

  // Never leak stack traces or raw error messages in production for 500s
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  return res.status(status).json({ error: message });
}

module.exports = errorMiddleware;
