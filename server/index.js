require("dotenv").config();

const express = require("express");
const cors = require("cors");
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

// --------------- Routes ---------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

// --------------- Error middleware (must be LAST) ---------------

app.use(errorMiddleware);

// --------------- Start server ---------------

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
}

// Only start the server if this file is run directly (not imported in tests).
if (require.main === module) {
  start();
}

// Export app for supertest
module.exports = { app, start };
