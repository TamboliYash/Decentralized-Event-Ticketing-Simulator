# Decentralized Event Ticketing Simulator — Server

A MERN-stack backend that gives a centralized server **blockchain-style tamper-evidence** by chaining tickets with SHA-256 hashes. Each ticket's hash is derived from its own fields plus the previous ticket's hash. Editing any past ticket breaks every link after it, and an admin dashboard walks the chain to show exactly where the break is.

> There is no real blockchain, no consensus, no gas — just the hash-chain integrity property inside MongoDB.

---

## Setup

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

### Installation

```bash
cd server
bun install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/ticketing` |
| `JWT_SECRET` | Secret key for signing JWTs | *(required)* |
| `JWT_EXPIRES_IN` | JWT token lifetime | `7d` |
| `PORT` | Server port | `5000` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `NODE_ENV` | `development` or `production` | `development` |
| `SIGN_QR` | Enable HMAC-signed QR codes (`true`/`false`) | `true` |

---

## Running

```bash
# Development (auto-reload)
bun run dev

# Production
bun run start

# Seed the database
bun run seed

# Run tests
bun run test
```

### Seeding

`bun run seed` drops all collections and creates:

- **5 users**: organizer, 2 buyers, staff, admin (all with password `password123`)
- **2 events** with realistic seat maps
- **8 tickets** issued through the real hash chain
- **5 entry logs** (Valid, Already Used, Invalid) so the admin dashboard isn't empty

Credentials are printed to the console on each run.

---

## How the Hash Chain Works

Every ticket issued on the platform is appended to a single, global hash chain — similar to how blocks are chained in a blockchain, but without decentralization or consensus.

1. **Issuance**: When a ticket is purchased, the server takes the ticket's immutable fields (`eventId`, `buyerId`, `seatNumber`, `seq`, `previousHash`, `status`, `issuedAt`), serializes them into a canonical pipe-delimited string, and computes the SHA-256 hash. This becomes the ticket's `currentHash`.

2. **Chaining**: The `previousHash` field always points to the `currentHash` of the ticket issued immediately before it (globally, across all events). The very first ticket's `previousHash` is a well-known genesis hash (`SHA-256("GENESIS")`).

3. **Tamper Detection**: If anyone modifies any field of any past ticket directly in the database, the recomputed hash will no longer match the stored `currentHash`. Furthermore, the *next* ticket's `previousHash` will no longer match, breaking the chain at that point and every point after it.

4. **Verification**: The admin dashboard walks the entire chain from seq 1 to N, checking four invariants at every link:
   - **Contiguity**: seq numbers are exactly 1, 2, 3… with no gaps
   - **Anchoring**: the first ticket's `previousHash` equals the genesis hash
   - **Linkage**: each ticket's `previousHash` matches the prior ticket's `currentHash`
   - **Field Integrity**: the recomputed hash from stored fields matches `currentHash`

This gives the system a strong **tamper-evidence** property: you can prove that no ticket has been altered since issuance, and you can pinpoint the exact location of any tampering.

---

## Route Table

### Auth (`/api/auth`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/auth/register` | — | — | Register a new user |
| POST | `/api/auth/login` | — | — | Login, returns JWT |
| GET | `/api/auth/me` | ✓ | any | Get current user profile |

### Events (`/api/events`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/events` | ✓ | organizer | Create event |
| GET | `/api/events` | ✓ | any | List/search events (paginated) |
| GET | `/api/events/:id` | ✓ | any | Event detail + seat availability |
| PUT | `/api/events/:id` | ✓ | organizer (owner) | Update event |
| DELETE | `/api/events/:id` | ✓ | organizer (owner) | Delete/cancel event |
| GET | `/api/events/:id/analytics` | ✓ | organizer (owner) | Sales stats |

### Tickets (`/api/tickets`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/tickets/purchase` | ✓ | buyer | Purchase a ticket |
| GET | `/api/tickets/mine` | ✓ | buyer | My tickets (paginated, with QR) |
| POST | `/api/tickets/verify` | ✓ | staff | Door scanner verification |
| POST | `/api/tickets/transfer` | ✓ | buyer | Transfer ticket to another buyer |
| GET | `/api/tickets/:id/provenance` | ✓ | owner/organizer/admin | Ownership history |

### Admin (`/api/admin`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/admin/chain` | ✓ | admin | Full chain with per-link validity |
| GET | `/api/admin/stats` | ✓ | admin | Platform statistics |
| GET | `/api/admin/users` | ✓ | admin | List/search users |
| PUT | `/api/admin/users/:id` | ✓ | admin | Update user role |
| DELETE | `/api/admin/events/:id` | ✓ | admin | Admin event removal |
| POST | `/api/admin/simulate-tamper` | ✓ | admin | Demo: break chain (dev only) |

### Other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |

---

## Project Structure

```
server/
├── index.js                          Entry point, middleware, routes, shutdown
├── config/db.js                      MongoDB connection
├── models/
│   ├── User.js                       User schema (roles, password hashing)
│   ├── Event.js                      Event schema (seat maps, validation)
│   ├── Ticket.js                     Ticket schema (hash chain fields)
│   ├── EntryLog.js                   Door scan audit log
│   └── ChainState.js                 Hash chain tip (atomic counter)
├── controllers/
│   ├── auth.controller.js            Register, login, me
│   ├── event.controller.js           CRUD, analytics, ownership
│   ├── ticket.controller.js          Purchase, verify, transfer, provenance
│   └── admin.controller.js           Chain, stats, users, tamper
├── middleware/
│   ├── auth.middleware.js            JWT verification
│   ├── role.middleware.js            Role-based access control
│   └── error.middleware.js           Central error handler
├── routes/
│   ├── auth.routes.js
│   ├── event.routes.js
│   ├── ticket.routes.js
│   └── admin.routes.js
├── utils/
│   ├── hashChain.js                  Hash computation, chain append, verify
│   └── qr.js                        QR code generation (plain + signed)
├── services/
│   └── payment.service.js            Mock payment gateway seam
├── seed.js                           Database seeder
├── .env.example
└── package.json
```
