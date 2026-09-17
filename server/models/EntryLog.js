const mongoose = require("mongoose");
const { Schema } = mongoose;

const entryLogSchema = new Schema(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null, // null when the scan was a forged / unknown hash
    },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Scanner (staff) reference is required"],
    },
    scanResult: {
      type: String,
      enum: {
        values: ["Valid", "Invalid", "Already Used"],
        message: "{VALUE} is not a valid scan result",
      },
      required: [true, "Scan result is required"],
    },
    scannedHash: {
      type: String,
      required: [true, "Scanned hash must be recorded"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No automatic timestamps — we use `timestamp` explicitly.
    timestamps: false,
  }
);

entryLogSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("EntryLog", entryLogSchema);
