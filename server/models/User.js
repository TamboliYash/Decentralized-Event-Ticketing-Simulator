const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ["organizer", "buyer", "staff", "admin"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/**
 * Schema-level toJSON transform.
 * Strips passwordHash and __v from every JSON serialization so they
 * can never leak into an API response, even if `select: false` is
 * accidentally bypassed with `.select('+passwordHash')`.
 */
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
