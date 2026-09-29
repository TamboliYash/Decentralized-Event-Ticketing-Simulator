/**
 * seed.js — Idempotent database seed for the Decentralized Event Ticketing Simulator.
 *
 * Drops ALL collections and recreates:
 *   - 5 users (organizer, buyer1, buyer2, staff, admin)
 *   - 2 events with realistic seat maps
 *   - ~8 tickets issued through the real appendTicket() path
 *   - EntryLogs with Valid, Invalid, and Already Used results
 *
 * Safe to re-run: drops everything first.
 *
 * Usage: bun seed.js
 */

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Event = require("./models/Event");
const Ticket = require("./models/Ticket");
const EntryLog = require("./models/EntryLog");
const ChainState = require("./models/ChainState");
const { appendTicket, GENESIS_HASH } = require("./utils/hashChain");

const BCRYPT_ROUNDS = 10;

// ── Fixed credentials (printed to console) ──
const USERS = [
  { name: "Alice Organizer", email: "alice@demo.com",   password: "password123", role: "organizer" },
  { name: "Bob Buyer",       email: "bob@demo.com",     password: "password123", role: "buyer" },
  { name: "Carol Buyer",     email: "carol@demo.com",   password: "password123", role: "buyer" },
  { name: "Dave Staff",      email: "dave@demo.com",    password: "password123", role: "staff" },
  { name: "Eve Admin",       email: "eve@demo.com",     password: "password123", role: "admin" },
];

async function seed() {
  await connectDB();
  console.log("\n🌱 Seeding database...\n");

  // ── Drop all collections ──
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.dropCollection(col.name);
  }
  console.log("✓ Dropped all existing collections");

  // ── Create users ──
  const userDocs = [];
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    const user = await User.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
    });
    userDocs.push(user);
  }
  const [organizer, buyer1, buyer2, staff, admin] = userDocs;

  console.log("✓ Created 5 users:");
  console.table(
    USERS.map((u) => ({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
    }))
  );

  // ── Create events (dates in the future) ──
  const futureDate1 = new Date();
  futureDate1.setMonth(futureDate1.getMonth() + 1);
  const futureDate2 = new Date();
  futureDate2.setMonth(futureDate2.getMonth() + 2);

  const event1 = await Event.create({
    title: "Tech Conference 2027",
    description: "Annual technology conference featuring AI, blockchain, and cloud computing talks.",
    date: futureDate1,
    venue: "Convention Center Hall A",
    seatMap: ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5"],
    price: 50,
    capacity: 10,
    organizerId: organizer._id,
  });

  const event2 = await Event.create({
    title: "Music Festival Night",
    description: "Live performances from indie bands and solo artists under the stars.",
    date: futureDate2,
    venue: "Open Air Amphitheater",
    seatMap: null, // General admission — no assigned seats
    price: 25,
    capacity: 100,
    organizerId: organizer._id,
  });

  console.log(`✓ Created events: "${event1.title}", "${event2.title}"`);

  // ── Issue ~8 tickets through the real appendTicket() path ──
  // This ensures the hash chain is genuinely valid.

  const ticket1 = await appendTicket({
    eventId: event1._id,
    buyerId: buyer1._id,
    seatNumber: "A1",
    status: "valid",
    issuedAt: new Date(),
  });

  const ticket2 = await appendTicket({
    eventId: event1._id,
    buyerId: buyer1._id,
    seatNumber: "A2",
    status: "valid",
    issuedAt: new Date(),
  });

  const ticket3 = await appendTicket({
    eventId: event1._id,
    buyerId: buyer2._id,
    seatNumber: "A3",
    status: "valid",
    issuedAt: new Date(),
  });

  const ticket4 = await appendTicket({
    eventId: event1._id,
    buyerId: buyer2._id,
    seatNumber: "B1",
    status: "valid",
    issuedAt: new Date(),
  });

  const ticket5 = await appendTicket({
    eventId: event2._id,
    buyerId: buyer1._id,
    seatNumber: null, // GA
    status: "valid",
    issuedAt: new Date(),
  });

  const ticket6 = await appendTicket({
    eventId: event2._id,
    buyerId: buyer1._id,
    seatNumber: null,
    status: "valid",
    issuedAt: new Date(),
  });

  const ticket7 = await appendTicket({
    eventId: event2._id,
    buyerId: buyer2._id,
    seatNumber: null,
    status: "valid",
    issuedAt: new Date(),
  });

  const ticket8 = await appendTicket({
    eventId: event2._id,
    buyerId: buyer2._id,
    seatNumber: null,
    status: "valid",
    issuedAt: new Date(),
  });

  console.log(`✓ Issued 8 tickets through appendTicket() (chain seq 1–8)`);

  // ── Mark ticket2 as "used" (simulating a door scan) ──
  await Ticket.updateOne({ _id: ticket2._id }, { $set: { status: "used" } });

  // ── Create EntryLogs for admin stats ──
  // 1. Valid scan (ticket1)
  await EntryLog.create({
    ticketId: ticket1._id,
    scannedBy: staff._id,
    scanResult: "Valid",
    scannedHash: ticket1.currentHash,
    timestamp: new Date(),
  });

  // 2. Already Used scan (ticket2 — scanned a second time)
  await EntryLog.create({
    ticketId: ticket2._id,
    scannedBy: staff._id,
    scanResult: "Valid",
    scannedHash: ticket2.currentHash,
    timestamp: new Date(Date.now() - 60000), // 1 min ago (the first valid scan)
  });
  await EntryLog.create({
    ticketId: ticket2._id,
    scannedBy: staff._id,
    scanResult: "Already Used",
    scannedHash: ticket2.currentHash,
    timestamp: new Date(),
  });

  // 3. Invalid scan (forged hash)
  await EntryLog.create({
    ticketId: null,
    scannedBy: staff._id,
    scanResult: "Invalid",
    scannedHash: "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    timestamp: new Date(),
  });

  // 4. Another Invalid scan (different forged hash)
  await EntryLog.create({
    ticketId: null,
    scannedBy: staff._id,
    scanResult: "Invalid",
    scannedHash: "00000000000000000000000000000000000000000000000000000000000000ff",
    timestamp: new Date(),
  });

  console.log("✓ Created 5 EntryLogs (1 Valid, 1 Already Used, 2 Invalid, 1 Valid-first-scan)");

  // ── Summary ──
  console.log("\n════════════════════════════════════════════");
  console.log("  Seed complete. Chain has 8 valid links.");
  console.log(`  Genesis hash: ${GENESIS_HASH.slice(0, 16)}…`);
  console.log("════════════════════════════════════════════\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
