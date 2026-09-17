const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * DESIGN DECISION — Chain ordering via `seq` instead of `issuedAt`
 * ----------------------------------------------------------------
 * `issuedAt` is a Date with millisecond precision.  Two tickets issued
 * inside the same ms have no deterministic order, which means the hash
 * chain cannot be reliably reconstructed — the claim that "chronological
 * order is cryptographically provable" collapses because you cannot
 * guarantee which ticket hashed which predecessor.
 *
 * `seq` is a monotonically-incrementing integer assigned atomically
 * (via findOneAndUpdate + $inc on a counter, or similar) when a ticket
 * is created.  It gives a total, deterministic ordering.  Every chain
 * walk MUST sort by `seq`, never by `issuedAt`.
 */

/**
 * DESIGN DECISION — Seat uniqueness (non-partial index)
 * -----------------------------------------------------
 * The original spec used a partial unique index filtered on { status: 'valid' }.
 * That is UNSAFE: once a ticket's status changes to 'used' or 'transferred',
 * it exits the partial index, and a new 'valid' ticket for the same
 * (eventId, seatNumber) pair can be inserted — a double-booking / double-sell.
 *
 * Example attack: Buyer A purchases seat 5 (status: valid).  Buyer A enters
 * the venue → status becomes 'used' → the seat leaves the partial index.
 * Now Buyer B can purchase seat 5 again.
 *
 * Fix: use a plain (non-partial) compound unique index on { eventId, seatNumber }.
 * Once a seat is sold for an event it can NEVER be sold again, regardless of
 * ticket status.  The index is partial only to exclude documents where
 * seatNumber is null (general-admission / un-seated tickets), which is correct
 * because those tickets intentionally have no seat to collide on.
 */

const ticketSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer reference is required"],
      index: true,
    },
    seatNumber: {
      type: String,
      default: null, // null = general admission (no assigned seat)
    },
    seq: {
      type: Number,
      required: [true, "Chain sequence number is required"],
      unique: true,
      index: true,
    },
    currentHash: {
      type: String,
      unique: true,
      index: true,
    },
    previousHash: {
      type: String,
      required: [true, "Previous hash is required for chain integrity"],
    },
    status: {
      type: String,
      enum: {
        values: ["valid", "used", "transferred"],
        message: "{VALUE} is not a valid ticket status",
      },
      default: "valid",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    transferredFrom: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    },
    originTicketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    }
  },
  {
    // No automatic timestamps — we use `issuedAt` explicitly.
    timestamps: false,
  }
);

/**
 * Compound unique index: one ACTIVE ticket per seat per event.
 * By filtering out 'transferred' tickets, we allow a seat to be passed
 * to a new owner (which creates a new Ticket document). But because 'used'
 * and 'valid' tickets remain in the index, a seat cannot be double-sold
 * or double-booked. We also exclude seatNumber:null (general admission).
 */
ticketSchema.index(
  { eventId: 1, seatNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { 
      seatNumber: { $type: "string" },
      status: { $ne: "transferred" }
    },
  }
);

ticketSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);
