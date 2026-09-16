const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getAnalytics,
  checkOwnership,
} = require("../controllers/event.controller");

const router = Router();

// All event routes require authentication
router.use(authMiddleware);

// POST   /api/events — organizer only
router.post("/", roleMiddleware("organizer"), createEvent);

// GET    /api/events — any authenticated user
router.get("/", listEvents);

// GET    /api/events/:id — any authenticated user (detail + availability)
router.get("/:id", getEvent);

// PUT    /api/events/:id — organizer + must own the event
router.put(
  "/:id",
  roleMiddleware("organizer"),
  checkOwnership,
  updateEvent
);

// DELETE /api/events/:id — organizer + must own the event
router.delete(
  "/:id",
  roleMiddleware("organizer"),
  checkOwnership,
  deleteEvent
);

// GET    /api/events/:id/analytics — organizer + must own the event
router.get(
  "/:id/analytics",
  roleMiddleware("organizer"),
  checkOwnership,
  getAnalytics
);

module.exports = router;
