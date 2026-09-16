const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const mongoose = require("mongoose");

// --------------- Helpers ---------------

/**
 * Allowed fields for event creation / update.
 * Everything else is rejected so callers cannot inject _id, organizerId,
 * cancelled, createdAt, etc.
 */
const ALLOWED_CREATE_FIELDS = [
  "title",
  "description",
  "date",
  "venue",
  "seatMap",
  "price",
  "capacity",
];

const ALLOWED_UPDATE_FIELDS = [
  "title",
  "description",
  "date",
  "venue",
  "seatMap",
  "price",
  "capacity",
];

/** Pick only whitelisted fields from a body object. */
function pickFields(body, allowed) {
  const result = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      result[key] = body[key];
    }
  }
  return result;
}

/**
 * Reusable ownership check.
 *
 * Loads the event by :id, verifies it exists, and verifies the
 * authenticated user (req.user.userId) is the organizer.
 *
 * On success, attaches `req.event` so the downstream handler doesn't
 * have to re-query.  On failure:
 *   - 400 if :id is not a valid ObjectId
 *   - 404 if event not found
 *   - 403 if the caller is not the event's organizer
 */
async function checkOwnership(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.organizerId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: you do not own this event" });
    }

    // Attach for downstream use — avoids a second DB query in the handler.
    req.event = event;
    next();
  } catch (err) {
    next(err);
  }
}

// --------------- Pagination defaults ---------------

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// --------------- Controllers ---------------

/**
 * POST /api/events
 *
 * Create a new event.  organizerId is set from the JWT — never from the
 * request body — so one organizer cannot create events on another's behalf.
 */
async function createEvent(req, res, next) {
  try {
    const fields = pickFields(req.body, ALLOWED_CREATE_FIELDS);
    fields.organizerId = req.user.userId;

    const event = await Event.create(fields);
    return res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/events
 *
 * List / search events with pagination.
 *
 * Query params:
 *   q      — case-insensitive match on title OR venue
 *   from   — events on or after this date
 *   to     — events on or before this date
 *   page   — 1-indexed page number (default 1)
 *   limit  — results per page (default 20, max 100)
 *
 * Returns: { data, page, limit, total }
 */
async function listEvents(req, res, next) {
  try {
    const filter = { cancelled: false };

    // ── Text search (q) ──
    if (req.query.q) {
      const regex = new RegExp(req.query.q, "i");
      filter.$or = [{ title: regex }, { venue: regex }];
    }

    // ── Date range ──
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        const from = new Date(req.query.from);
        if (isNaN(from.getTime())) {
          return res.status(400).json({ error: "Invalid 'from' date" });
        }
        filter.date.$gte = from;
      }
      if (req.query.to) {
        const to = new Date(req.query.to);
        if (isNaN(to.getTime())) {
          return res.status(400).json({ error: "Invalid 'to' date" });
        }
        filter.date.$lte = to;
      }
    }

    // ── Pagination ──
    let page = parseInt(req.query.page, 10) || DEFAULT_PAGE;
    let limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
    if (page < 1) page = DEFAULT_PAGE;
    if (limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Event.find(filter).sort({ date: 1 }).skip(skip).limit(limit),
      Event.countDocuments(filter),
    ]);

    return res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/events/:id
 *
 * Returns a single event plus computed seat availability:
 *   - takenSeats: array of seatNumbers with status valid or used
 *   - ticketsSold: count of non-transferred tickets
 *   - remainingCapacity: capacity − ticketsSold
 */
async function getEvent(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Compute seat availability — seats held by valid or used tickets
    const takenTickets = await Ticket.find(
      { eventId: event._id, status: { $in: ["valid", "used"] } },
      { seatNumber: 1, _id: 0 }
    );

    const takenSeats = takenTickets
      .map((t) => t.seatNumber)
      .filter((s) => s !== null);

    const ticketsSold = takenTickets.length;
    const remainingCapacity = event.capacity - ticketsSold;

    return res.json({
      ...event.toJSON(),
      takenSeats,
      ticketsSold,
      remainingCapacity,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/events/:id
 *
 * Update an event.  Ownership is verified by the checkOwnership middleware
 * so req.event is already available.
 *
 * Only whitelisted fields are accepted.  organizerId, cancelled, and _id
 * cannot be overwritten through this endpoint.
 */
async function updateEvent(req, res, next) {
  try {
    const fields = pickFields(req.body, ALLOWED_UPDATE_FIELDS);

    if (Object.keys(fields).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    // Apply fields and run validators
    Object.assign(req.event, fields);
    await req.event.save({ validateModifiedOnly: true });

    return res.json(req.event);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/events/:id
 *
 * DESIGN DECISION — soft-delete via `cancelled` flag.
 *
 * Hard-deleting an event that has issued tickets would orphan every
 * ticket.eventId reference and destroy the audit trail the hash chain
 * depends on.  Soft-deleting preserves referential integrity and keeps
 * the chain walkable.
 *
 * If no tickets have ever been issued the event is hard-deleted since
 * there is nothing to orphan.
 */
async function deleteEvent(req, res, next) {
  try {
    const ticketCount = await Ticket.countDocuments({
      eventId: req.event._id,
    });

    if (ticketCount > 0) {
      // Soft-delete — tickets exist, must preserve references
      req.event.cancelled = true;
      await req.event.save();
      return res.json({
        message: "Event cancelled (soft-deleted to preserve ticket chain integrity)",
        event: req.event,
      });
    }

    // Hard-delete — no tickets, nothing to orphan
    await Event.findByIdAndDelete(req.event._id);
    return res.json({ message: "Event deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/events/:id/analytics
 *
 * Returns sales stats for the event via an aggregation pipeline:
 *   - ticketsSold
 *   - revenue (ticketsSold × event.price)
 *   - remainingCapacity
 *   - statusBreakdown: { valid, used, transferred }
 *
 * Uses $facet to compute total count and per-status breakdown in a
 * single pipeline pass.
 */
async function getAnalytics(req, res, next) {
  try {
    const event = req.event; // set by checkOwnership

    const [result] = await Ticket.aggregate([
      { $match: { eventId: event._id } },
      {
        $facet: {
          total: [{ $count: "count" }],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const ticketsSold = result.total[0]?.count || 0;
    const revenue = ticketsSold * event.price;
    const remainingCapacity = event.capacity - ticketsSold;

    // Build the status breakdown with defaults
    const statusBreakdown = { valid: 0, used: 0, transferred: 0 };
    for (const entry of result.byStatus) {
      if (entry._id in statusBreakdown) {
        statusBreakdown[entry._id] = entry.count;
      }
    }

    return res.json({
      eventId: event._id,
      title: event.title,
      ticketsSold,
      revenue,
      remainingCapacity,
      statusBreakdown,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getAnalytics,
  checkOwnership,
};
