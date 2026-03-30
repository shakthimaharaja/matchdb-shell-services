# matchdb-shell-services

Authentication, OAuth, Payments & Membership backend for the MatchDB staffing platform. Also serves as the **API gateway** — all `/api/jobs/*` requests are forwarded to `matchdb-jobs-services` via `http-proxy-middleware`, so frontend UIs only need to know about a single backend origin. Uses **MongoDB Atlas** via Mongoose.

---

## Tech Stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Runtime    | Node.js + TypeScript                                           |
| Framework  | Express 4                                                      |
| Database   | MongoDB Atlas via Mongoose 8                                   |
| Auth       | JWT (access + refresh), bcryptjs, Google OAuth                 |
| OAuth      | Passport.js + passport-google-oauth20                          |
| Payments   | Stripe (subscriptions + one-time candidate pkgs)               |
| Email      | SendGrid                                                       |
| Validation | Zod                                                            |
| Security   | Helmet, CORS, compression                                      |
| Gateway    | http-proxy-middleware (forwards /api/jobs/\* to jobs-services) |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB Atlas** connection string (pre-configured in env files)

### Install & Run

```powershell
# 1. Install dependencies
npm install

# 2. Seed the database (run once after cloning)
npm run seed

# 3. Start the dev server (hot-reload)
npm run dev
```

The server starts on **http://localhost:8000**.

### Seed Data

`npm run seed` populates the `matchdb-shell` database with:

- **15 users** — 3 admin accounts, 10 candidates, 2 vendors
- **15 subscriptions** — one per user (pro_plus, marketer, pro, basic, free)
- **6 candidate payments** — visibility package purchases

Admin credentials — `admin@vendor.com`, `admin@marketer.com`, `admin@markerter.com` (password: `admin@123`).
Test credentials — all other accounts use password `Test1234!`.

See the [root README](../README.md) for the full account list.

---

## Project Structure

```
matchdb-shell-services/
├── src/
│   ├── index.ts               # Entry point — starts Express server
│   ├── app.ts                 # Express app (routes, middleware, Swagger)
│   ├── config/
│   │   ├── env.ts             # Environment variable loading & validation
│   │   ├── mongoose.ts        # MongoDB connection (Atlas)
│   │   ├── passport.ts        # Google OAuth strategy (graceful degradation)
│   │   └── swagger.ts         # OpenAPI 3.0 spec (all endpoints)
│   ├── models/
│   │   ├── User.ts            # User accounts (candidate/vendor/marketer)
│   │   ├── Subscription.ts    # Stripe subscription plans
│   │   ├── RefreshToken.ts    # JWT refresh token registry
│   │   ├── CandidatePayment.ts # One-time visibility purchases
│   │   └── index.ts           # Barrel export
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
│   │   └── stripe.service.ts       # Stripe customer, subscription & candidate pkg helpers
│   ├── scripts/
│   │   └── seed.ts                 # Database seed script
│   └── types/
│       └── express.d.ts            # Express.User augmentation for req.user typing
├── env/
│   ├── .env.local             # Local dev env vars
│   ├── .env.development       # Dev env vars
│   ├── .env.qa                # QA env vars
│   └── .env.production        # Production env vars
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## API Endpoints

### Auth

| Method | Path                        | Auth | Description                             |
| ------ | --------------------------- | ---- | --------------------------------------- |
| POST   | `/api/auth/register`        | No   | Create a new user (generates username)  |
| POST   | `/api/auth/login`           | No   | Login, returns JWT tokens               |
| POST   | `/api/auth/refresh`         | No   | Refresh access token                    |
| GET    | `/api/auth/verify`          | Yes  | Get current user profile                |
| POST   | `/api/auth/logout`          | Yes  | Revoke refresh token                    |
| DELETE | `/api/auth/account`         | Yes  | Permanently delete account (cascading)  |
| GET    | `/api/auth/google`          | No   | Initiate Google OAuth                   |
| GET    | `/api/auth/google/callback` | No   | Google OAuth callback -> JWT + redirect |

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

## Database (MongoDB Atlas)

This service connects to the `matchdb-shell` database on MongoDB Atlas.
Schemas are defined as Mongoose models — no migrations needed.

### Collections (4 models)

- **User** — `_id`, `email`, `password?`, `googleId?`, `firstName`, `lastName`, `username`, `userType`, `membershipConfig?`, `hasPurchasedVisibility`, `isActive`
- **Subscription** — `plan` (free/basic/pro/pro_plus/marketer), `status`, `stripeCustomerId?`, `stripeSubId?`
- **RefreshToken** — `token`, `userId`, `expiresAt`, `revoked`
- **CandidatePayment** — `packageType`, `domain?`, `subdomains`, `amountCents`, `status`

See [DATABASE-SCHEMA.md](../DATABASE-SCHEMA.md) for the full schema reference.

---

## Environment Variables

Config is loaded from `env/.env.{NODE_ENV}` files. Key variables:

```env
PORT=8000
NODE_ENV=local
MONGO_URI=mongodb+srv://...@matchdb.rhutf6s.mongodb.net/matchdb-shell?retryWrites=true&w=majority
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-min-32-chars
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CLIENT_URL=http://localhost:3000
JOBS_SERVICES_URL=http://localhost:8001
```

---

## Scripts

| Script          | Description                         |
| --------------- | ----------------------------------- |
| `npm run dev`   | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/`       |
| `npm start`     | Run compiled output                 |
| `npm run seed`  | Seed the database with test data    |

---

## Google OAuth

- Uses Passport.js with `passport-google-oauth20`
- **Account linking:** if a user with the same email exists, their Google ID is linked
- **User type** is passed via the OAuth `state` parameter
- **Graceful degradation:** if `GOOGLE_CLIENT_ID` is not set, OAuth routes return 501

---

## Username Generation

Each user gets a unique URL-safe slug: `{firstName}-{lastName}-{idPrefix}` (e.g., `alex-morgan-a1b2c3`). Used for shareable public profile URLs.

---

## API Documentation (Swagger)

Interactive API docs at **http://localhost:8000/api-docs**. OpenAPI 3.0 spec defined in `src/config/swagger.ts`.

---

## License

MIT
