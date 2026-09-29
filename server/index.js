require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const errorMiddleware = require("./middleware/error.middleware");

// Route imports
const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const ticketRoutes = require("./routes/ticket.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// --------------- Global middleware ---------------

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// --------------- Request logger ---------------
// Logs method, path, status, duration, and userId (when authenticated).
// NEVER logs the Authorization header, tokens, or password fields.

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const userId = req.user?.userId || "anon";
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms user=${userId}`;

    if (res.statusCode >= 500) {
      console.error(`[REQ] ${line}`);
    } else {
      console.log(`[REQ] ${line}`);
    }
  });

  next();
});

// --------------- Routes ---------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

// --------------- 404 handler for unmatched /api routes ---------------

// Express 5 uses path-to-regexp v8; wildcards need a named param.
app.all("/api/{*splat}", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --------------- Error middleware (must be LAST) ---------------

app.use(errorMiddleware);

// --------------- Start server ---------------

const PORT = process.env.PORT || 5000;
let server;

async function start() {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
}

// --------------- Graceful shutdown ---------------

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
    });
  }

  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Only start the server if this file is run directly (not imported in tests).
if (require.main === module) {
  start();
}

// Export app for supertest
module.exports = { app, start };
