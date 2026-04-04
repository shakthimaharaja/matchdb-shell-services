# MatchingDB Shell Services — Copilot Rules

## Project Overview

This is the **Auth & Payments API** for the MatchingDB staffing platform. It runs on **port 8000** and handles user registration, login, JWT tokens, Google OAuth, and Stripe subscriptions.

**Stack:** Node.js, Express, TypeScript, Mongoose 8, MongoDB Atlas, Stripe, Passport.js, SendGrid

---

## Scripts

| Command         | Purpose                                        |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Start dev server with hot-reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/`                  |
| `npm start`     | Run the compiled production build              |
| `npm run seed`  | Seed the database with test data               |

## Running the Application

Use VS Code tasks (`Ctrl+Shift+B`) or the PowerShell script:

```powershell
# From the MatchingDB workspace root:
.\start-matchdb.ps1
```

## Committing & Pushing

Always use the shared push script from the workspace root:

```powershell
# From the MatchingDB workspace root:
.\push-all.ps1
```

This stages, commits, and pushes all repos with a single shared commit message.

---

## Code Conventions

### File Structure

```
src/
  app.ts              # Express app setup, middleware, route mounting
  index.ts            # Server entry point (connects DB, starts listening)
  config/             # env.ts, passport.ts, swagger.ts
  controllers/        # Route handlers — one file per domain
  middleware/          # auth.middleware.ts, error.middleware.ts
  models/             # Mongoose schemas — one file per collection
  routes/             # Express routers — one file per domain
  services/           # Business logic (stripe.service.ts, etc.)
  scripts/            # seed.ts and other CLI scripts
  types/              # TypeScript type definitions
```

### Naming

- Files: `kebab-case.ts` (e.g., `auth.controller.ts`, `auth.routes.ts`)
- Models: `PascalCase` (e.g., `User`, `Subscription`, `RefreshToken`)
- Route files: `{domain}.routes.ts` → mounted at `/api/{domain}`
- Controller files: `{domain}.controller.ts`

### API Patterns

- All routes use `/api/` prefix
- Auth routes: `/api/auth/*`
- Payment routes: `/api/payments/*`
- JWT Bearer auth via `Authorization: Bearer <token>` header
- Middleware: `requireAuth` (any logged-in user)
- Validation with Zod schemas
- Error responses: `{ error: string }` with appropriate HTTP status
- Swagger JSDoc annotations on all route handlers

### Environment

- Config loaded from `env/.env.local` (dev) or env vars (prod)
- `JWT_SECRET` must match with jobs-services
- MongoDB Atlas — no local database

### Security

- Helmet for security headers
- CORS whitelist in env config
- Stripe webhook signature verification
- bcryptjs for password hashing
- JWT access + refresh token pattern

### Swagger

- All endpoints must have JSDoc swagger annotations
- Swagger UI at `/api-docs`
- Schemas defined in `src/config/swagger.ts`
- Use `@swagger` JSDoc blocks above each route handler

---

## Database Collections (matchdb-shell)

| Collection        | Model            | Description                            |
| ----------------- | ---------------- | -------------------------------------- |
| users             | User             | Email/password + Google OAuth accounts |
| subscriptions     | Subscription     | Stripe subscription state per user     |
| refreshtokens     | RefreshToken     | JWT refresh token storage              |
| candidatepayments | CandidatePayment | One-time candidate package purchases   |

---

## Do NOT

- Add `console.log` — use structured error responses
- Store secrets in code — use env vars
- Skip Swagger annotations on new endpoints
- Modify `JWT_SECRET` without updating jobs-services to match
- Use `any` type — define proper TypeScript interfaces
