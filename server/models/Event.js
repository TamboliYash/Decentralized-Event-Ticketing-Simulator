const mongoose = require("mongoose");
const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: function (value) {
          // Only enforce "future date" on document creation, not on updates.
          // `this.isNew` is true only when the document has never been saved.
          if (this.isNew) {
            return value > new Date();
          }
          return true;
        },
        message: "Event date must be in the future",
      },
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    seatMap: {
      type: Schema.Types.Mixed,
      default: null,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Capacity must be a whole number",
      },
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
      index: true,
    },
    /**
     * Soft-delete flag.  Hard-deleting an event that has issued tickets
     * would orphan ticket.eventId references and destroy the audit trail
     * the hash chain depends on.  Setting cancelled = true preserves
     * referential integrity and chain walkability.
     */
    cancelled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

eventSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Event", eventSchema);
