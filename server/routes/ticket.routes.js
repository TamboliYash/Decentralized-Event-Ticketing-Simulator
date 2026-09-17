const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const { purchaseTicket, getMyTickets, verifyTicket, transferTicket, getProvenance } = require("../controllers/ticket.controller");

const router = Router();

// Basic in-memory rate limiter for staff verification
// Limitation: In a multi-instance/cluster deployment, this memory is isolated 
// per Node process. For production, this should be backed by Redis.
const rateLimits = new Map();
function verifyRateLimit(req, res, next) {
  const userId = req.user.userId;
  const now = Date.now();
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 60;     // 1 scan per second average

  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  const info = rateLimits.get(userId);
  if (now > info.resetAt) {
    info.count = 1;
    info.resetAt = now + WINDOW_MS;
    return next();
  }

  info.count++;
  if (info.count > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many verification attempts" });
  }

  next();
}

// All ticket routes require authentication
router.use(authMiddleware);

// POST /api/tickets/purchase — buyers only
router.post("/purchase", roleMiddleware("buyer"), purchaseTicket);

// GET /api/tickets/mine — buyers only
router.get("/mine", roleMiddleware("buyer"), getMyTickets);

// POST /api/tickets/verify — staff only
router.post("/verify", roleMiddleware("staff"), verifyRateLimit, verifyTicket);

// POST /api/tickets/transfer — buyers only
router.post("/transfer", roleMiddleware("buyer"), transferTicket);

// GET /api/tickets/:id/provenance — any authenticated user (handler checks specific access)
router.get("/:id/provenance", getProvenance);

module.exports = router;
