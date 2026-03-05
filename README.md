# matchdb-shell-services

Authentication, OAuth, Payments & Membership backend for the MatchDB staffing platform. **Owns the unified PostgreSQL schema and all database migrations** — jobs-services shares the same database.

---

## Tech Stack

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Runtime    | Node.js + TypeScript                             |
| Framework  | Express 4                                        |
| Database   | PostgreSQL via Prisma 5 ORM                      |
| Auth       | JWT (access + refresh), bcryptjs, Google OAuth   |
| OAuth      | Passport.js + passport-google-oauth20            |
| Payments   | Stripe (subscriptions + one-time candidate pkgs) |
| Email      | SendGrid                                         |
| Validation | Zod                                              |
| Security   | Helmet, CORS, compression                        |

---

## Project Structure

```
matchdb-shell-services/
├── prisma/
│   ├── schema.prisma          # Full unified schema (12 models — auth + jobs)
│   └── migrations/            # Prisma migration history (owns all migrations)
├── src/
│   ├── index.ts               # Entry point — starts Express server
│   ├── app.ts                 # Express app (routes, middleware, Swagger)
│   ├── config/
│   │   ├── env.ts             # Environment variable loading & validation
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── passport.ts        # Google OAuth strategy (graceful degradation)
│   │   └── swagger.ts         # OpenAPI 3.0 spec (all endpoints)
│   ├── controllers/
│   │   ├── auth.controller.ts      # Register, login, refresh, verify, logout, delete, OAuth
│   │   └── payments.controller.ts  # Stripe checkout, webhook, portal, candidate packages
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification guard
│   │   └── error.middleware.ts     # Global error handler + 404
│   ├── routes/
│   │   ├── auth.routes.ts          # /api/auth/*
│   │   └── payments.routes.ts      # /api/payments/*
│   ├── scripts/
│   │   └── seed.ts                 # Full database seed (3 users, 15 jobs, 11 profiles)
│   ├── services/
│   │   ├── jwt.service.ts          # Token sign / verify helpers
│   │   ├── sendgrid.service.ts     # Email dispatch (welcome email on register)
│   │   └── stripe.service.ts       # Stripe customer, subscription & candidate pkg helpers
│   └── types/
│       └── express.d.ts            # Express.User augmentation for req.user typing
├── env/
│   └── .env.local             # Local env vars
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## API Endpoints

### Auth

| Method | Path                        | Auth | Description                                           |
| ------ | --------------------------- | ---- | ----------------------------------------------------- |
| POST   | `/api/auth/register`        | No   | Create a new user (generates username)                |
| POST   | `/api/auth/login`           | No   | Login, returns JWT tokens                             |
| POST   | `/api/auth/refresh`         | No   | Refresh access token                                  |
| GET    | `/api/auth/verify`          | Yes  | Get current user profile                              |
| POST   | `/api/auth/logout`          | Yes  | Revoke refresh token                                  |
| DELETE | `/api/auth/account`         | Yes  | Permanently delete account (cascading)                |
| GET    | `/api/auth/google`          | No   | Initiate Google OAuth (`?userType=candidate\|vendor`) |
| GET    | `/api/auth/google/callback` | No   | Google OAuth callback → JWT + redirect                |

### Payments

| Method | Path                               | Auth | Description                                       |
| ------ | ---------------------------------- | ---- | ------------------------------------------------- |
| GET    | `/api/payments/plans`              | No   | List subscription plans                           |
| GET    | `/api/payments/subscription`       | Yes  | Get current user's subscription                   |
| POST   | `/api/payments/checkout`           | Yes  | Create Stripe subscription checkout               |
| POST   | `/api/payments/webhook`            | No   | Stripe webhook receiver                           |
| POST   | `/api/payments/portal`             | Yes  | Create Stripe billing portal                      |
| GET    | `/api/payments/candidate-packages` | No   | List candidate visibility packages                |
| POST   | `/api/payments/candidate-checkout` | Yes  | One-time Stripe checkout for candidate visibility |
| GET    | `/health`                          | No   | Health check                                      |

---

## Database (Unified PostgreSQL)

This service **owns the schema** for the entire MatchDB platform. Both `matchdb-shell-services` and `matchdb-jobs-services` connect to the same PostgreSQL database.

### Schema (12 models)

**Auth models (managed here):**

- **User** — `id`, `email`, `password?`, `googleId?`, `firstName`, `lastName`, `username`, `userType` (candidate/vendor/marketer/admin), `membershipConfig?`, `hasPurchasedVisibility`, `isActive`
- **Subscription** — `plan` (free/basic/pro/pro_plus/enterprise/marketer), `status`, `stripeCustomerId?`, `stripeSubscriptionId?`
- **RefreshToken** — `token`, `userId`, `expiresAt`, `revoked`
- **CandidatePayment** — `packageType`, `domain?`, `subdomains`, `amountCents`, `status`

**Jobs models (used by jobs-services):**

- **Job** — `title`, `description`, `vendorId`, `jobType`, `jobSubType`, `skillsRequired[]`, `experienceRequired`, `workMode`, `isActive`
- **CandidateProfile** — `candidateId`, `username`, `name`, `skills[]`, `visibilityConfig`, `profileLocked`
- **Application** — `jobId`, `candidateId`, `status`
- **PokeRecord** — `fromUserId`, `toUserId`, `jobId?`, `message?`
- **PokeLog** — `userId`, `yearMonth`, `count` (rate-limiting)
- **Company** — `name`, `marketerId`, `marketerEmail`
- **MarketerCandidate** — `companyId`, `marketerId`, `candidateId`
- **ForwardedOpening** — `marketerId`, `candidateId`, `jobId`

---

## Seed Data

Run the seed with:

```powershell
npx tsx src/scripts/seed.ts
```

Creates:

- **3 users:** `candidate@test.com` / `Test1234!`, `vendor@test.com` / `Test1234!`, `marketer@test.com` / `Marketer123!`
- **15 jobs** across various tech roles (all owned by the vendor)
- **11 candidate profiles** (1 linked to the candidate user + 10 browsable)
- **1 company** ("Elite Staffing Solutions") with 3 rostered candidates

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** running on port 5432

### Install & Run

```powershell
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create / migrate the PostgreSQL database
npx prisma migrate dev

# 4. Seed demo data
npx tsx src/scripts/seed.ts

# 5. Start the dev server (hot-reload)
npm run dev
```

The server starts on **http://localhost:8000**.

---

## Environment Variables

Create `env/.env.local`:

```env
PORT=8000
NODE_ENV=local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/matchdb
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-min-32-chars
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d

# Google OAuth (optional — routes return 501 if unset)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Stripe (optional for local dev)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=

CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:4000,http://localhost:4001
CLIENT_URL=http://localhost:3000
```

---

## Scripts

| Script                    | Description                         |
| ------------------------- | ----------------------------------- |
| `npm run dev`             | Start with hot reload (`tsx watch`) |
| `npm run build`           | Compile TypeScript to `dist/`       |
| `npm start`               | Run compiled output                 |
| `npm run prisma:generate` | Regenerate Prisma client            |
| `npm run prisma:migrate`  | Run database migrations             |
| `npm run prisma:deploy`   | Deploy migrations (production)      |
| `npm run prisma:studio`   | Open Prisma Studio GUI (port 5555)  |
| `npm run prisma:seed`     | Seed database via Prisma            |

---

## Google OAuth

- Uses Passport.js with `passport-google-oauth20`
- **Account linking:** if a user with the same email exists, their Google ID is linked
- **User type** is passed via the OAuth `state` parameter
- **Graceful degradation:** if `GOOGLE_CLIENT_ID` is not set, OAuth routes return 501

## Username Generation

Each user gets a unique URL-safe slug: `{firstName}-{lastName}-{idPrefix}` (e.g., `alex-morgan-a1b2c3`). Used for shareable public profile URLs.

---

## API Documentation (Swagger)

Interactive API docs at **http://localhost:8000/api-docs**. OpenAPI 3.0 spec defined in `src/config/swagger.ts`.

---

## License

MIT
