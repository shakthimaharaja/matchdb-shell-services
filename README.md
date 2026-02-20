# matchdb-shell-services

Authentication, OAuth, Payments & Membership backend for the MatchDB staffing platform.

## Tech Stack

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Runtime    | Node.js + TypeScript                             |
| Framework  | Express 4                                        |
| Database   | SQLite via Prisma ORM                            |
| Auth       | JWT (access + refresh), bcryptjs, Google OAuth   |
| OAuth      | Passport.js + passport-google-oauth20            |
| Payments   | Stripe (subscriptions + one-time candidate pkgs) |
| Email      | SendGrid                                         |
| Validation | Zod                                              |
| Security   | Helmet, CORS                                     |

## Project Structure

```
matchdb-shell-services/
├── prisma/
│   └── schema.prisma        # User, Subscription, RefreshToken, CandidatePayment models
├── src/
│   ├── index.ts              # Entry point — starts Express server
│   ├── app.ts                # Express app setup (routes, middleware, Swagger)
│   ├── config/
│   │   ├── env.ts            # Environment variable loading & validation
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── passport.ts       # Google OAuth strategy (graceful degradation)
│   │   └── swagger.ts        # ★ OpenAPI 3.0 spec (all auth + payments endpoints)
│   ├── controllers/
│   │   ├── auth.controller.ts      # Register, login, refresh, verify, logout, delete, OAuth
│   │   └── payments.controller.ts  # Stripe checkout, webhook, portal, candidate packages
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification guard
│   │   └── error.middleware.ts     # Global error handler + 404
│   ├── routes/
│   │   ├── auth.routes.ts          # /api/auth/*
│   │   └── payments.routes.ts      # /api/payments/*
│   ├── services/
│   │   ├── jwt.service.ts          # Token sign / verify helpers
│   │   ├── sendgrid.service.ts     # Email dispatch (welcome email on register)
│   │   └── stripe.service.ts       # Stripe customer + subscription + candidate pkg helpers
│   └── types/
│       └── express.d.ts            # Express.User augmentation for req.user typing
├── seed.ts                   # Create demo users (10 candidates + 7 vendors)
├── env/
│   └── .env.development      # Local env vars (create from template below)
├── package.json
└── tsconfig.json
```

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
| POST   | `/api/payments/checkout`           | Yes  | Create Stripe subscription checkout               |
| POST   | `/api/payments/webhook`            | No   | Stripe webhook receiver                           |
| POST   | `/api/payments/portal`             | Yes  | Create Stripe billing portal                      |
| GET    | `/api/payments/candidate-packages` | No   | List candidate visibility packages                |
| POST   | `/api/payments/candidate-checkout` | Yes  | One-time Stripe checkout for candidate visibility |
| GET    | `/health`                          | No   | Health check                                      |

## Data Models

### User

`id`, `email`, `password?`, `googleId?`, `firstName`, `lastName`, `username` (unique URL slug), `userType` (candidate/vendor), `membershipConfig?` (JSON), `hasPurchasedVisibility`, `isActive`

### Subscription

`plan` (free/pro/enterprise), `status`, `stripeCustomerId?`, `stripeSubscriptionId?`

### CandidatePayment

Tracks one-time visibility package purchases:
`stripeSessionId`, `stripePaymentIntentId?`, `packageType` (base/subdomain_addon/single_domain_bundle/full_bundle), `domain?`, `subdomains` (JSON array), `amountCents`, `status` (pending/completed/failed)

### Membership Config

Aggregated from all completed `CandidatePayment` records:

```json
{ "contract": ["c2c", "c2h", "w2"], "full_time": ["w2", "direct_hire"] }
```

**Contract subdomains:** `c2c`, `c2h`, `w2`, `1099`  
**Full-time subdomains:** `c2h`, `w2`, `direct_hire`, `salary`

## Google OAuth

- Uses Passport.js with `passport-google-oauth20`
- **Account linking:** if a user with the same email exists, their Google ID is linked
- **User type** is passed via the OAuth `state` parameter
- **Graceful degradation:** if `GOOGLE_CLIENT_ID` is not set, OAuth routes return 501

## Username Generation

Each user gets a unique URL-safe slug: `{firstName}-{lastName}-{idPrefix}` (e.g., `alice-johnson-3458c1`). Used for shareable public profile URLs.

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

## Environment Variables

Create `env/.env.development`:

```env
DATABASE_URL=file:../dev.db
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-min-32-chars
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d
PORT=8000

# Google OAuth (optional — routes return 501 if unset)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Optional — leave blank for local dev
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=

CORS_ORIGINS=http://localhost:3000,http://localhost:4000
CLIENT_URL=http://localhost:3000
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create / migrate the SQLite database
npx prisma migrate dev

# 4. Seed demo users (password for all: Password1!)
npx tsx seed.ts

# 5. Start the dev server (hot-reload)
npm run dev
```

The server starts on **http://localhost:8000**.

## Seeded Accounts

All passwords: `Password1!`

### Candidates (10)

| Email              | Plan       | Username             | Membership Config     |
| ------------------ | ---------- | -------------------- | --------------------- |
| alice@example.com  | pro        | alice-johnson-3458c1 | FT (w2, c2h), C (c2c) |
| bob@example.com    | free       | bob-smith-b444f8     | FT (w2), C (c2c, c2h) |
| carol@example.com  | free       | carol-davis-3f7616   | C (c2c, c2h, w2)      |
| grace@devmail.com  | pro        | grace-lee-a1b2c3     | FT (w2)               |
| hank@coderz.io     | free       | hank-patel-a1b2c3    | C (c2h, w2)           |
| irene@webdev.com   | enterprise | irene-garcia-a1b2c3  | FT (w2, c2h)          |
| jack@stackhire.com | free       | jack-thompson-a1b2c3 | FT (w2, c2h)          |
| karen@datapro.net  | pro        | karen-white-a1b2c3   | FT (w2)               |
| leo@cloudops.dev   | free       | leo-martinez-a1b2c3  | FT (w2), C (c2h)      |
| mia@appforge.io    | pro        | mia-robinson-a1b2c3  | C (c2c), FT (w2)      |

All candidates have `hasPurchasedVisibility: true` for testing.

### Vendors (7)

| Email               | Plan       | Username            |
| ------------------- | ---------- | ------------------- |
| dan@techcorp.com    | pro        | dan-brown-d8c0ac    |
| eve@startup.io      | enterprise | eve-wilson-b25adc   |
| frank@agency.com    | free       | frank-miller-379a35 |
| nina@recruit.co     | pro        | nina-chen-a1b2c3    |
| oscar@hiringlab.com | enterprise | oscar-nguyen-a1b2c3 |
| paula@talentedge.io | pro        | paula-kim-a1b2c3    |
| quinn@staffplus.com | free       | quinn-adams-a1b2c3  |

## Available Scripts

| Script                    | Description                       |
| ------------------------- | --------------------------------- |
| `npm run dev`             | Start with hot reload (tsx watch) |
| `npm run build`           | Compile TypeScript to `dist/`     |
| `npm start`               | Run compiled output               |
| `npm run prisma:generate` | Regenerate Prisma client          |
| `npm run prisma:migrate`  | Run database migrations           |
| `npm run prisma:studio`   | Open Prisma Studio GUI            |

## API Documentation (Swagger)

Interactive API docs are available at **http://localhost:8000/api-docs** when the server is running. The OpenAPI 3.0 spec is defined inline in `src/config/swagger.ts` and covers all auth and payments endpoints with request/response schemas.
