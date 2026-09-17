const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const EntryLog = require("../models/EntryLog");
const paymentService = require("../services/payment.service");
const crypto = require("crypto");
const { appendTicket, verifyChainLink } = require("../utils/hashChain");
const { generateQR } = require("../utils/qr");

/**
 * POST /api/tickets/purchase
 */
async function purchaseTicket(req, res, next) {
  try {
    const { eventId, seatNumber } = req.body;
    const buyerId = req.user.userId;

    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    // 1. Validate Event State
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.cancelled) return res.status(400).json({ error: "Event is cancelled" });
    if (event.date < new Date()) return res.status(400).json({ error: "Event is in the past" });

    // 2. Validate seatMap bounds (if venue has specific seating)
    if (event.seatMap && seatNumber) {
      const isValidSeat = Array.isArray(event.seatMap)
        ? event.seatMap.includes(seatNumber)
        : Object.keys(event.seatMap).includes(seatNumber);

      if (!isValidSeat) {
        return res.status(400).json({ error: "Invalid seat number for this venue" });
      }
    }

    // 3. Early capacity & availability check
    // (We do this before the mock payment to save processing, though DB unique indexes
    // provide the final concurrency guarantee).
    const ticketsSold = await Ticket.countDocuments({ eventId: event._id });
    if (ticketsSold >= event.capacity) {
      return res.status(400).json({ error: "Event is sold out" });
    }

    if (seatNumber) {
      const seatTaken = await Ticket.exists({ eventId: event._id, seatNumber });
      if (seatTaken) {
        return res.status(409).json({ error: "Seat is already taken" });
      }
    }

    // 4. Mock Payment Step (Seam)
    const payment = await paymentService.processPayment({
      amount: event.price,
      userId: buyerId,
      eventId: event._id,
    });

    if (!payment.success) {
      return res.status(400).json({ error: "Payment failed" });
    }

    // 5. Issue ticket via hash chain
    let ticket;
    try {
      // NOTE: We do NOT compute hashes here. We delegate to appendTicket.
      ticket = await appendTicket({
        eventId: event._id,
        buyerId,
        seatNumber: seatNumber || null,
        status: "valid",
        issuedAt: new Date(),
      });
    } catch (err) {
      // ── CONCURRENCY GUARANTEE ──
      // If two requests pass the early checks and try to buy the same seat concurrently,
      // they both hit `appendTicket`. MongoDB's underlying storage engine atomically
      // enforces the compound unique index on `{ eventId: 1, seatNumber: 1 }`.
      // The second attempt will throw a Duplicate Key Error (11000). We catch it and return 409.
      if (err.code === 11000 && err.keyPattern && err.keyPattern.seatNumber !== undefined) {
        // In a live system, you MUST trigger a refund here because payment succeeded.
        return res.status(409).json({ error: "Seat was purchased by another user concurrently" });
      }
      throw err;
    }

    // 6. Generate QR Lazily
    let qrDataUrl = null;
    try {
      qrDataUrl = await generateQR({ hash: ticket.currentHash, ticketId: ticket._id });
    } catch (qrErr) {
      console.error("QR generation failed at purchase:", qrErr);
      // We purposefully DO NOT fail the request. The ticket is safely on-chain.
      // Returning it without the QR allows the buyer to fetch the QR later via /mine.
    }

    return res.status(201).json({ ticket, qrDataUrl });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tickets/mine
 */
async function getMyTickets(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const buyerId = req.user.userId;

    const filter = { buyerId };
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10) || 1;
    let limitNum = parseInt(limit, 10) || 20;
    if (limitNum > 100) limitNum = 100;

    const skip = (pageNum - 1) * limitNum;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("eventId", "title date venue")
        .sort({ issuedAt: -1 }) // Newest first
        .skip(skip)
        .limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    // Lazily derive QRs for valid tickets
    const data = await Promise.all(
      tickets.map(async (ticket) => {
        const ticketObj = ticket.toJSON();
        
        // Generate QR only for valid tickets; omit for used/transferred.
        if (ticket.status === "valid") {
          try {
            ticketObj.qrDataUrl = await generateQR({
              hash: ticket.currentHash,
              ticketId: ticket._id,
            });
          } catch (e) {
            ticketObj.qrDataUrl = null; // Failsafe
          }
        }
        return ticketObj;
      })
    );

    return res.json({ data, page: pageNum, limit: limitNum, total });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper to log scan attempts. Swallows errors so the verification result
 * is always returned to the staff UI even if the DB log fails.
 */
async function logEntry(ticketId, scannedBy, result, hash) {
  try {
    await EntryLog.create({
      ticketId,
      scannedBy,
      scanResult: result,
      scannedHash: hash,
      timestamp: new Date(),
    });
  } catch (e) {
    console.error("Failed to write EntryLog:", e);
  }
}

/**
 * POST /api/tickets/verify
 * Staff door scanner endpoint. 
 */
async function verifyTicket(req, res, next) {
  try {
    // Note: A rate-limiting middleware is recommended to blunt brute-force 
    // guessing of hashes, implemented on the route layer.
    const { hash, sig, ticketId } = req.body;
    const scannerId = req.user.userId;

    if (!hash) {
      return res.status(400).json({ error: "Hash is required" });
    }

    // 1. Check Signed Payload (if enabled)
    if (process.env.SIGN_QR === "true") {
      if (!sig || !ticketId) {
        // Return 200 Invalid so the UI renders a negative verdict cleanly.
        return res.json({ result: "Invalid", reason: "Missing signature or ticketId in signed mode" });
      }
      const secret = process.env.JWT_SECRET || "fallback_dev_secret";
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(`${hash}|${ticketId}`);
      if (sig !== hmac.digest("hex")) {
        await logEntry(null, scannerId, "Invalid", hash);
        return res.json({ result: "Invalid", reason: "Cryptographic signature mismatch" });
      }
    }

    // 2. Lookup Ticket
    const ticket = await Ticket.findOne({ currentHash: hash });

    if (!ticket) {
      // Do not leak closeness to a real hash.
      await logEntry(null, scannerId, "Invalid", hash);
      return res.json({ result: "Invalid", reason: "Ticket not found or forged" });
    }

    // 3. Status checks
    if (ticket.status === "used") {
      const priorLog = await EntryLog.findOne({ ticketId: ticket._id, scanResult: "Valid" })
        .populate("scannedBy", "name")
        .sort({ timestamp: 1 }); // get the first scan

      await logEntry(ticket._id, scannerId, "Already Used", hash);
      return res.json({
        result: "Already Used",
        scannedAt: priorLog ? priorLog.timestamp : null,
        scannedBy: priorLog?.scannedBy ? priorLog.scannedBy.name : "Unknown",
      });
    }

    if (ticket.status === "transferred") {
      await logEntry(ticket._id, scannerId, "Invalid", hash);
      return res.json({ result: "Invalid", reason: "Ticket was transferred" });
    }

    // 4. Verify Local Hash Chain Link
    if (!verifyChainLink(ticket)) {
      await logEntry(ticket._id, scannerId, "Invalid", hash);
      return res.json({ result: "Invalid", reason: "Chain integrity failure" });
    }

    // 5. Atomically transition Valid -> Used
    // This uses a condition on `status: "valid"` to ensure two concurrent scans 
    // at different gates will result in exactly one "Valid" and one "Already Used".
    // Never read-then-save.
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticket._id, status: "valid" },
      { $set: { status: "used" } },
      { new: true }
    );

    if (!updatedTicket) {
      // It was valid a millisecond ago, but the atomic update failed, meaning 
      // another staff member scanned it precisely at the same time.
      const priorLog = await EntryLog.findOne({ ticketId: ticket._id, scanResult: "Valid" })
        .populate("scannedBy", "name")
        .sort({ timestamp: -1 });

      await logEntry(ticket._id, scannerId, "Already Used", hash);
      return res.json({
        result: "Already Used",
        scannedAt: priorLog ? priorLog.timestamp : null,
        scannedBy: priorLog?.scannedBy ? priorLog.scannedBy.name : "Unknown",
      });
    }

    // 6. Success
    await logEntry(ticket._id, scannerId, "Valid", hash);
    return res.json({ result: "Valid" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tickets/transfer
 */
async function transferTicket(req, res, next) {
  try {
    const { ticketId, recipientEmail } = req.body;
    const currentOwnerId = req.user.userId;

    if (!ticketId || !recipientEmail) {
      return res.status(400).json({ error: "ticketId and recipientEmail are required" });
    }

    // 1. Validate Recipient
    const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }
    if (recipient.role !== "buyer") {
      return res.status(400).json({ error: "Recipient must be a buyer" });
    }
    if (recipient._id.toString() === currentOwnerId) {
      return res.status(400).json({ error: "Cannot transfer to yourself" });
    }

    // 2. Validate current ticket and atomically mark as transferred
    // By using findOneAndUpdate with status: "valid", we ensure it can only be 
    // transferred once. If it's already used or transferred, this returns null.
    const oldTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId, buyerId: currentOwnerId, status: "valid" },
      { $set: { status: "transferred" } },
      { new: true }
    );

    if (!oldTicket) {
      return res.status(400).json({ error: "Ticket not found or no longer valid for transfer" });
    }

    // 3. Issue new ticket via hash chain
    let newTicket;
    try {
      newTicket = await appendTicket({
        eventId: oldTicket.eventId,
        buyerId: recipient._id,
        seatNumber: oldTicket.seatNumber, // can be null
        status: "valid",
        issuedAt: new Date(),
        transferredFrom: oldTicket._id,
        originTicketId: oldTicket.originTicketId || oldTicket._id,
      });
    } catch (err) {
      // Very rare: If appendTicket fails (e.g. DB crash), we must revert the old ticket
      // back to valid so the user doesn't lose their ticket.
      await Ticket.updateOne({ _id: ticketId }, { $set: { status: "valid" } });
      throw err;
    }

    // 4. Generate QR for new ticket
    let qrDataUrl = null;
    try {
      qrDataUrl = await generateQR({ hash: newTicket.currentHash, ticketId: newTicket._id });
    } catch (qrErr) {
      console.error("QR generation failed during transfer:", qrErr);
    }

    return res.status(201).json({ ticket: newTicket, qrDataUrl });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tickets/:id/provenance
 */
async function getProvenance(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const ticket = await Ticket.findById(id).populate("eventId");
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Access control: Only current owner, event organizer, or admin.
    const isOwner = ticket.buyerId.toString() === userId;
    const isOrganizer = ticket.eventId.organizerId && ticket.eventId.organizerId.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to view this ticket's provenance" });
    }

    // Walk the transferredFrom chain backwards
    const history = [];
    let current = ticket;

    while (current) {
      // We populate buyer details for the history
      await current.populate("buyerId", "name email");
      
      history.push({
        ticketId: current._id,
        ownerName: current.buyerId.name,
        ownerEmail: current.buyerId.email,
        issuedAt: current.issuedAt,
        status: current.status,
      });

      if (current.transferredFrom) {
        current = await Ticket.findById(current.transferredFrom);
      } else {
        current = null; // Reached the original issuance
      }
    }

    return res.json({ history });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  purchaseTicket,
  getMyTickets,
  verifyTicket,
  transferTicket,
  getProvenance,
};
