const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const {
  getChain,
  getStats,
  listUsers,
  updateUser,
  adminDeleteEvent,
  simulateTamper,
} = require("../controllers/admin.controller");

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// GET  /api/admin/chain — full chain with per-link validity (paginated)
router.get("/chain", getChain);

// GET  /api/admin/stats — platform-wide statistics
router.get("/stats", getStats);

// GET  /api/admin/users — list/search/paginate users
router.get("/users", listUsers);

// PUT  /api/admin/users/:id — update user role / details
router.put("/users/:id", updateUser);

// DELETE /api/admin/events/:id — admin-level event removal
router.delete("/events/:id", adminDeleteEvent);

// POST /api/admin/simulate-tamper — DEMO ONLY, gated in controller
router.post("/simulate-tamper", simulateTamper);

module.exports = router;
