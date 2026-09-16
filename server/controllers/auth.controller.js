const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// --------------- Helpers ---------------

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Roles that can be self-assigned during public registration.
 * `admin` is intentionally excluded — admin accounts are created only
 * via seed.js (or a future admin-invite flow). This prevents privilege
 * escalation through the public API.
 */
const SELF_ASSIGNABLE_ROLES = ["organizer", "buyer", "staff"];

/**
 * Whitelist of fields accepted from the request body for registration.
 * Anything else is silently ignored so callers cannot inject extra
 * Mongoose fields (e.g. _id, __v, createdAt).
 */
function pickRegistrationFields(body) {
  return {
    name: body.name,
    email: body.email,
    password: body.password,
    role: body.role,
  };
}

/**
 * Build a signed JWT.  Payload contains ONLY { userId, role } — no
 * email, no name, nothing that changes and desynchronises the token.
 */
function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// --------------- Controllers ---------------

/**
 * POST /api/auth/register
 *
 * Creates a new user account. The `admin` role cannot be self-assigned —
 * admins are created exclusively via seed.js.
 *
 * Body: { name, email, password, role }
 * Returns: { token, user }
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = pickRegistrationFields(req.body);

    // ── Validate required fields ──
    if (!name || !email || !password || !role) {
      const err = new Error("name, email, password, and role are required");
      err.status = 400;
      throw err;
    }

    // ── Block admin self-assignment ──
    if (!SELF_ASSIGNABLE_ROLES.includes(role)) {
      const err = new Error(
        `Role "${role}" cannot be self-assigned. Allowed: ${SELF_ASSIGNABLE_ROLES.join(", ")}`
      );
      err.status = 403;
      throw err;
    }

    // ── Enforce minimum password length ──
    if (password.length < MIN_PASSWORD_LENGTH) {
      const err = new Error(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
      err.status = 400;
      throw err;
    }

    // ── Hash password & create user ──
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, passwordHash, role });

    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user by email + password.
 * Returns an identical generic error for "no such email" and "wrong
 * password" so the endpoint cannot be used to enumerate accounts.
 *
 * Body: { email, password }
 * Returns: { token, user }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;
      throw err;
    }

    // Need passwordHash for comparison — override `select: false`
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+passwordHash");

    // Generic message — identical for missing user and wrong password
    const GENERIC_FAIL = "Invalid email or password";

    if (!user) {
      const err = new Error(GENERIC_FAIL);
      err.status = 401;
      throw err;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      const err = new Error(GENERIC_FAIL);
      err.status = 401;
      throw err;
    }

    const token = signToken(user);

    // user.toJSON() strips passwordHash via the schema transform
    return res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Used by the frontend to rehydrate the session on page reload.
 * Requires the auth middleware to have set req.user.
 *
 * Returns: the user document (sans passwordHash)
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    return res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
