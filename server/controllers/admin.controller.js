const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const EntryLog = require("../models/EntryLog");
const {
  GENESIS_HASH,
  computeHash,
  verifyChainLink,
  verifyFullChain,
} = require("../utils/hashChain");

// ─────────────────────────────────────────────────────────
// GET /api/admin/chain
// ─────────────────────────────────────────────────────────
//
// HOW PAGINATION + WHOLE-CHAIN SUMMARY WORKS:
//
// The summary (totalLinks, valid count, firstBrokenSeq, chainValid) must
// always reflect the ENTIRE chain, not just the current page.  Otherwise
// a tampered ticket on page 4 looks fine when viewing page 1.
//
// We achieve this in two passes:
//   1. verifyFullChain() walks ALL tickets once (sorted by seq) and
//      produces a Map<seq, perLinkResult>.  This is O(N) in tickets and
//      unavoidable — you cannot verify a hash chain without reading
//      every link.  The summary is derived from this complete walk.
//   2. We then slice the results array for the requested page and return
//      only that window, alongside the whole-chain summary.
//
// For extremely large chains (100k+), this would need to be moved to a
// background job with cached results.  For a university demo with a few
// hundred tickets, the in-request walk is fine.
// ─────────────────────────────────────────────────────────

async function getChain(req, res, next) {
  try {
    // Pagination params
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 50;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 200) limit = 200;

    // Full chain walk for summary + per-link verdicts
    const allTickets = await Ticket.find().sort({ seq: 1 });
    const totalLinks = allTickets.length;

    let validCount = 0;
    let firstBrokenSeq = null;
    let chainValid = true;
    let expectedPreviousHash = GENESIS_HASH;
    let expectedSeq = 1;

    // Build per-link results for EVERY ticket
    const linkResults = allTickets.map((ticket) => {
      // ── Contiguity ──
      const contiguityOk = ticket.seq === expectedSeq;

      // ── Linkage (includes genesis anchoring for seq 1) ──
      const linkageOk = ticket.previousHash === expectedPreviousHash;

      // ── Field integrity ──
      const fieldIntegrityOk = verifyChainLink(ticket);

      const isBroken = !contiguityOk || !linkageOk || !fieldIntegrityOk;
      let failureReason = null;

      if (!contiguityOk) {
        failureReason = `Expected seq ${expectedSeq}, found ${ticket.seq}`;
      } else if (!linkageOk) {
        failureReason = "previousHash does not match prior ticket's currentHash";
      } else if (!fieldIntegrityOk) {
        failureReason = "Recomputed hash does not match stored currentHash — fields tampered";
      }

      if (isBroken && chainValid) {
        chainValid = false;
        firstBrokenSeq = ticket.seq;
      }

      if (!isBroken) validCount++;

      // Advance expectations for next iteration
      expectedPreviousHash = ticket.currentHash;
      expectedSeq = ticket.seq + 1;

      return {
        seq: ticket.seq,
        ticketId: ticket._id,
        currentHash: ticket.currentHash,
        previousHash: ticket.previousHash,
        status: ticket.status,
        issuedAt: ticket.issuedAt,
        displayHash: ticket.currentHash
          ? ticket.currentHash.slice(0, 12) + "…"
          : null,
        check: {
          fieldIntegrityOk,
          linkageOk,
          isBroken,
          failureReason,
        },
      };
    });

    // Slice for the requested page
    const start = (page - 1) * limit;
    const pageData = linkResults.slice(start, start + limit);

    return res.json({
      summary: {
        totalLinks,
        valid: validCount,
        firstBrokenSeq,
        chainValid,
      },
      data: pageData,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────

async function getStats(req, res, next) {
  try {
    // Run all aggregations concurrently
    const [
      ticketsSold,
      activeEvents,
      entryAgg,
      dailyScans,
      chainResult,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Event.countDocuments({ cancelled: false }),

      // Entry scan stats in a single pipeline
      EntryLog.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            fraud: [
              { $match: { scanResult: { $ne: "Valid" } } },
              { $count: "count" },
            ],
          },
        },
      ]),

      // Time series: scans per day for charts
      EntryLog.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      verifyFullChain(),
    ]);

    const entriesScanned = entryAgg[0]?.total[0]?.count || 0;
    const fraudAttemptsBlocked = entryAgg[0]?.fraud[0]?.count || 0;

    return res.json({
      ticketsSold,
      entriesScanned,
      fraudAttemptsBlocked,
      activeEvents,
      chainValid: chainResult.valid,
      dailyScans,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────

async function listUsers(req, res, next) {
  try {
    const { q, role } = req.query;
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const filter = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    if (role) {
      filter.role = role;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({ data, page, limit, total });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────
// PUT /api/admin/users/:id
// ─────────────────────────────────────────────────────────

const ALLOWED_USER_UPDATE_FIELDS = ["name", "role"];

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // ── Guard 1: Cannot modify your own account ──
    if (id === adminId) {
      return res.status(403).json({
        error: "Self-lockout protection: admins cannot modify their own account via this endpoint",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Pick only whitelisted fields
    const updates = {};
    for (const key of ALLOWED_USER_UPDATE_FIELDS) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    // ── Guard 2: Cannot remove the last admin ──
    if (user.role === "admin" && updates.role && updates.role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(403).json({
          error: "Cannot demote the last remaining admin — the platform would be unmanageable",
        });
      }
    }

    Object.assign(user, updates);
    await user.save({ validateModifiedOnly: true });

    return res.json(user);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/events/:id
// ─────────────────────────────────────────────────────────
//
// Applies the same chain-preserving deletion rule from the
// organizer's deleteEvent (Prompt 3): soft-delete if tickets
// exist, hard-delete if none.

async function adminDeleteEvent(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const ticketCount = await Ticket.countDocuments({ eventId: event._id });

    if (ticketCount > 0) {
      event.cancelled = true;
      await event.save();
      return res.json({
        message: "Event cancelled by admin (soft-deleted to preserve ticket chain integrity)",
        event,
      });
    }

    await Event.findByIdAndDelete(event._id);
    return res.json({ message: "Event deleted by admin" });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/admin/simulate-tamper
// ─────────────────────────────────────────────────────────
//
// ██████████████████████████████████████████████████████████
// ██  DEMO-ONLY ENDPOINT — NEVER AVAILABLE IN PRODUCTION ██
// ██████████████████████████████████████████████████████████
//
// Directly edits a ticket's seatNumber WITHOUT recomputing
// hashes, so the next chain verification will detect the
// tampering.  Use this during your presentation to
// demonstrate the chain breaking live.

async function simulateTamper(req, res, next) {
  try {
    // ═══════════════════════════════════════════════════════
    //  PRODUCTION GUARD — loud and obvious
    // ═══════════════════════════════════════════════════════
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        error: "simulate-tamper is DISABLED in production. This endpoint exists only for demo/development.",
      });
    }

    const { ticketId, newSeatNumber } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: "ticketId is required" });
    }
    if (newSeatNumber === undefined) {
      return res.status(400).json({ error: "newSeatNumber is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID format" });
    }

    // Bypass Mongoose — write directly to MongoDB so no validators
    // or hooks can interfere.  This is the point: we are simulating
    // a malicious or accidental raw database edit.
    const result = await Ticket.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(ticketId) },
      { $set: { seatNumber: newSeatNumber } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.json({
      message: `TAMPERED: seatNumber changed to "${newSeatNumber}" WITHOUT recomputing hash. Chain is now broken at this ticket.`,
      ticketId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getChain,
  getStats,
  listUsers,
  updateUser,
  adminDeleteEvent,
  simulateTamper,
};
