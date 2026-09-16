const mongoose = require("mongoose");

/**
 * Tracks the current tip of the hash chain to enable atomic appends
 * via optimistic concurrency control.
 */
const chainStateSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "main",
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
    },
    lastHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("ChainState", chainStateSchema);
