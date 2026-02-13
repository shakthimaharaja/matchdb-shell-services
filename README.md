# matchdb-shell-services

Authentication & Payments backend for the MatchDB staffing platform.

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Runtime    | Node.js + TypeScript                    |
| Framework  | Express 4                               |
| Database   | SQLite via Prisma ORM                   |
| Auth       | JWT (access + refresh tokens), bcryptjs |
| Payments   | Stripe (subscriptions, webhooks)        |
| Email      | SendGrid                                |
| Validation | Zod                                     |
| Security   | Helmet, CORS                            |

## Project Structure

```
matchdb-shell-services/
├── prisma/
│   └── schema.prisma        # User, Subscription, RefreshToken models
├── src/
│   ├── index.ts              # Entry point — starts Express server
│   ├── app.ts                # Express app setup (routes, middleware)
│   ├── config/
│   │   ├── env.ts            # Environment variable loading & validation
│   │   └── prisma.ts         # Prisma client singleton
│   ├── controllers/
│   │   ├── auth.controller.ts      # Register, login, refresh, me, logout
│   │   └── payments.controller.ts  # Stripe checkout, webhook, portal
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification guard
│   │   └── error.middleware.ts     # Global error handler + 404
│   ├── routes/
│   │   ├── auth.routes.ts          # /api/auth/*
│   │   └── payments.routes.ts      # /api/payments/*
│   └── services/
│       ├── jwt.service.ts          # Token sign / verify helpers
│       ├── sendgrid.service.ts     # Email dispatch
│       └── stripe.service.ts       # Stripe customer + subscription helpers
├── seed.ts                   # Create demo users (alice, bob, carol, dan, eve, frank)
├── env/
│   └── .env.development      # Local env vars (create from template below)
├── package.json
└── tsconfig.json
```

## API Endpoints

| Method | Path                     | Auth | Description                  |
| ------ | ------------------------ | ---- | ---------------------------- |
| POST   | `/api/auth/register`     | No   | Create a new user            |
| POST   | `/api/auth/login`        | No   | Login, returns JWT tokens    |
| POST   | `/api/auth/refresh`      | No   | Refresh access token         |
| GET    | `/api/auth/me`           | Yes  | Get current user profile     |
| POST   | `/api/auth/logout`       | Yes  | Revoke refresh token         |
| POST   | `/api/payments/checkout` | Yes  | Create Stripe checkout       |
| POST   | `/api/payments/webhook`  | No   | Stripe webhook receiver      |
| POST   | `/api/payments/portal`   | Yes  | Create Stripe billing portal |
| GET    | `/health`                | No   | Health check                 |

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

| Email             | Type      | Plan       | Password   |
| ----------------- | --------- | ---------- | ---------- |
| alice@example.com | candidate | pro        | Password1! |
| bob@example.com   | candidate | free       | Password1! |
| carol@example.com | candidate | free       | Password1! |
| dan@techcorp.com  | vendor    | pro        | Password1! |
| eve@startup.io    | vendor    | enterprise | Password1! |
| frank@agency.com  | vendor    | free       | Password1! |

## Available Scripts

| Script                    | Description                       |
| ------------------------- | --------------------------------- |
| `npm run dev`             | Start with hot reload (tsx watch) |
| `npm run build`           | Compile TypeScript to `dist/`     |
| `npm start`               | Run compiled output               |
| `npm run prisma:generate` | Regenerate Prisma client          |
| `npm run prisma:migrate`  | Run database migrations           |
| `npm run prisma:studio`   | Open Prisma Studio GUI            |
