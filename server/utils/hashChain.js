const crypto = require("crypto");
const Ticket = require("../models/Ticket");
const ChainState = require("../models/ChainState");

const GENESIS_HASH = crypto
  .createHash("sha256")
  .update("GENESIS")
  .digest("hex");

/**
 * BUG 1 FIX — Timestamp Coercion & Canonicalization
 * -------------------------------------------------
 * Instead of template literals which use locale/timezone-dependent Date
 * stringification (losing milliseconds), this function is the single
 * source of truth for serialization.
 *
 * It explicitly formats Dates to ISO string, Objects to String, and uses
 * a reserved separator "|" to prevent field boundary collisions
 * (e.g. ("a", "bc") vs ("ab", "c")).
 */
function canonicalPayload(fields) {
  const { eventId, buyerId, seatNumber, seq, previousHash, status, issuedAt } =
    fields;

  const SEP = "|";

  return [
    String(eventId),
    String(buyerId),
    seatNumber === null || seatNumber === undefined ? "null" : String(seatNumber),
    String(seq),
    String(previousHash),
    String(status),
    new Date(issuedAt).toISOString(),
  ].join(SEP);
}

function computeHash(fields) {
  const payload = canonicalPayload(fields);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * BUG 3 FIX — Read-Then-Write Race
 * --------------------------------
 * This implements an atomic findOneAndUpdate on a ledger-tip document
 * (Optimistic Concurrency Control). It reads the tip, computes the new hash,
 * and only advances the tip if it hasn't changed in the meantime. If it
 * changed, it retries.
 * 
 * In a standalone local mongod, this ensures atomicity without Replica Set
 * transactions. In production (with a replica set), you would wrap both
 * the ChainState update and Ticket creation in a single MongoDB transaction
 * (`session.withTransaction(...)`) so a crash between the two doesn't leave
 * a stranded ledger state. Here, we manually revert the ledger if Ticket
 * creation fails (e.g. due to double-booked seat).
 */
async function appendTicket(ticketData) {
  let retries = 5;

  while (retries-- > 0) {
    // 1. Read the ledger tip
    let state = await ChainState.findById("main");
    if (!state) {
      state = { seq: 0, lastHash: GENESIS_HASH };
    }

    const seq = state.seq + 1;
    const previousHash = state.lastHash;
    const issuedAt = ticketData.issuedAt || new Date();

    // 2. Compute new hash locally
    const currentHash = computeHash({
      ...ticketData,
      seq,
      previousHash,
      issuedAt,
    });

    // 3. Atomically attempt to advance the tip
    let updatedState;
    if (state.seq === 0) {
      try {
        updatedState = await ChainState.create({
          _id: "main",
          seq,
          lastHash: currentHash,
        });
      } catch (err) {
        if (err.code === 11000) continue; // Concurrency on genesis
        throw err;
      }
    } else {
      updatedState = await ChainState.findOneAndUpdate(
        { _id: "main", seq: state.seq },
        { $set: { seq, lastHash: currentHash } },
        { new: true }
      );
    }

    if (!updatedState) {
      // The tip advanced while we were computing. Try again.
      continue;
    }

    // 4. Tip advanced safely. Insert the actual ticket.
    try {
      const ticket = await Ticket.create({
        ...ticketData,
        seq,
        previousHash,
        currentHash,
        issuedAt,
      });
      return ticket;
    } catch (err) {
      // Rollback the ledger tip if the ticket insert fails 
      // (e.g. unique seat constraint violation)
      if (state.seq === 0) {
        await ChainState.findByIdAndDelete("main");
      } else {
        await ChainState.updateOne(
          { _id: "main", seq },
          { $set: { seq: state.seq, lastHash: state.lastHash } }
        );
      }
      throw err;
    }
  }

  throw new Error("Failed to append ticket due to high concurrency.");
}

function verifyChainLink(ticket) {
  const recomputed = computeHash(ticket);
  return recomputed === ticket.currentHash;
}

/**
 * BUG 2 FIX — Verify Full Chain (Not Just Self-Consistency)
 * ---------------------------------------------------------
 * Walks the chain checking 4 invariants:
 * (d) Contiguity: seq values are exactly 1, 2, 3... (no gaps/deletions)
 * (b) Linkage: previousHash === prior ticket's currentHash
 * (c) Anchoring: first ticket's previousHash === GENESIS_HASH
 * (a) Integrity: recomputed hash === stored currentHash
 */
async function verifyFullChain() {
  const tickets = await Ticket.find().sort({ seq: 1 });
  
  if (tickets.length === 0) {
    return { valid: true };
  }

  let expectedPreviousHash = GENESIS_HASH;
  let expectedSeq = 1;

  for (const ticket of tickets) {
    // Check (d): No gaps or out-of-order seq numbers
    if (ticket.seq !== expectedSeq) {
      return {
        valid: false,
        brokenAtSeq: ticket.seq,
        ticketId: ticket._id,
        failedCheck: "Contiguity",
        reason: `Expected seq ${expectedSeq}, but found ${ticket.seq}`,
      };
    }

    // Check (b) & (c): previousHash correctly links to prior chain tip
    if (ticket.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAtSeq: ticket.seq,
        ticketId: ticket._id,
        failedCheck: "Linkage",
        reason: "previousHash does not match the expected prior hash",
      };
    }

    // Check (a): Fields haven't been tampered with
    if (!verifyChainLink(ticket)) {
      return {
        valid: false,
        brokenAtSeq: ticket.seq,
        ticketId: ticket._id,
        failedCheck: "Integrity",
        reason: "Recomputed hash does not match stored currentHash",
      };
    }

    expectedPreviousHash = ticket.currentHash;
    expectedSeq++;
  }

  return { valid: true };
}

module.exports = {
  GENESIS_HASH,
  canonicalPayload,
  computeHash,
  appendTicket,
  verifyChainLink,
  verifyFullChain,
};
