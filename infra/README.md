# MatchingDB — Micro-Frontend Staffing Platform

MatchingDB is a **micro-frontend (MFE)** workforce management platform built with **Webpack 5 Module Federation** and backed by **MongoDB Atlas** (MERN stack). It combines the patterns of **ADP** (people management), **QuickBooks** (financials), and **Fieldglass** (timesheets) into a single staffing application across six repositories.

---

## Table of Contents

1. [Repositories](#repositories)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Key Features](#key-features)
5. [Component Library](#component-library)
6. [API Reference](#api-reference)
7. [Getting Started](#getting-started)
8. [Running Locally](#running-locally)
9. [Test Accounts](#test-accounts)
10. [Database](#database)
11. [Deployment](#deployment)
12. [Project Structure](#project-structure)
13. [Scripts](#scripts)
14. [Environment Variables](#environment-variables)
15. [Troubleshooting](#troubleshooting)

---

## Repositories

| Repo                           | Role                      | Port(s)    | Stack                              |
| ------------------------------ | ------------------------- | ---------- | ---------------------------------- |
| `matchdb-shell-ui`             | Host / Shell UI           | 3000       | React 18, TypeScript, Webpack 5 MF |
| `matchdb-jobs-ui`              | Remote MFE (Jobs)         | 3001       | React 18, TypeScript, Webpack 5 MF |
| `matchdb-shell-services`       | Auth & Payments API       | 8000       | Express, Mongoose 8, MongoDB Atlas |
| `matchdb-jobs-services`        | Jobs, Matching & Finance  | 8001       | Express, Mongoose 8, MongoDB Atlas |
| `matchingdb-component-library` | Shared UI & Design System | 6006\*     | React, CSS, Storybook 7            |
| `matchdb-data-collection-mono` | Data Ingestion Tool       | 5001, 5173 | Express + React (Vite monorepo)    |

\* Storybook dev port — the library is consumed via local `npm link`, not at runtime.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser  http://localhost:3000                                         │
│                                                                         │
│  ┌───────────────────────┐     Module Federation     ┌────────────────┐│
│  │  Shell UI (Host)      │◄──── remoteEntry.js ─────►│  Jobs UI (MFE) ││
│  │  • Sidebar & Nav      │                           │  • Dashboards  ││
│  │  • Theme System       │  CustomEvent bridge       │  • Public View ││
│  │  • Login / Pricing    │◄──────────────────────────│  • Employer    ││
│  │  • OAuth Callback     │  matchdb:subnav           │  • Financials  ││
│  └──────────┬────────────┘  matchdb:openLogin        └───────┬────────┘│
│             │               matchdb:jobTypeFilter             │         │
│             │  webpack devServer proxy                        │         │
│             ▼                                                 ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Shell Services :8000  (API Gateway)                                ││
│  │  • /api/auth/*      → auth.controller (JWT + Google OAuth)         ││
│  │  • /api/payments/*  → payments.controller (Stripe)                 ││
│  │  • /api/user/*      → user.controller (profile, preferences)       ││
│  │  • /api/jobs/*      → PROXY ──────────────────────┐                ││
│  └───────────────────────────────────────────────────┼────────────────┘│
│                                                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Jobs Services :8001                                                ││
│  │  • /api/jobs/*          → Jobs CRUD, search, matching              ││
│  │  • /api/employer/*      → Company, roster, invites, RBAC           ││
│  │  • /api/financials/*    → Project rates, margins, tax              ││
│  │  • /api/timesheets/*    → Contractor hours (Fieldglass)            ││
│  │  • /api/invoices/*      → Invoice generation (QuickBooks)          ││
│  │  • /api/bills/*         → Bill management                          ││
│  │  • /api/payroll/*       → Payroll integration (ADP People)         ││
│  │  • /api/vendors/*       → Vendor company management                ││
│  │  • /api/clients/*       → Client company management                ││
│  │  • /api/interviews/*    → Interview scheduling                     ││
│  │  • /api/jobs/events     → SSE live updates                         ││
│  │  • /api/jobs/poll/*     → HTTP polling (30s interval)              ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                              │                      │                   │
│                              ▼                      ▼                   │
│                    ┌──────────────────┐   ┌──────────────────┐          │
│                    │  MongoDB Atlas   │   │  MongoDB Atlas   │          │
│                    │  matchingdb-shell│   │  matchingdb-jobs │          │
│                    │  (4 collections) │   │  (20 collections)│          │
│                    └──────────────────┘   └──────────────────┘          │
│                                                                         │
│          Cluster: matchingdb.mrumkpb.mongodb.net                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture Decisions

- **API Gateway** — Shell Services proxies all `/api/jobs/*` to Jobs Services via `http-proxy-middleware`. Frontend only talks to `:8000`.
- **Module Federation** — Shell UI is the host. Jobs UI exposes `./JobsApp` as a remote. Shell dynamically loads it from `remoteEntry.js`.
- **Inter-MFE Communication** — `CustomEvent` dispatch for cross-MFE signaling (navigation, login triggers, filters).
- **Polling over WebSocket** — HTTP polling every 30s with delta detection. Simpler infrastructure, no socket server needed.
- **SSE for Ingest** — Server-Sent Events at `/api/jobs/events` for live dashboard refresh after bulk data ingest.
- **No ORM migrations** — Mongoose schemas are the source of truth. `_id: String` (generated via `new ObjectId().toString()`), no `populate()`, all queries use `.lean()`.

---

## Tech Stack

### Frontend

| Technology                | Purpose                             |
| ------------------------- | ----------------------------------- |
| React 18                  | UI framework                        |
| TypeScript 5              | Type safety                         |
| Webpack 5                 | Bundler + Module Federation         |
| Vite                      | Dev server (data-collection client) |
| Redux Toolkit + RTK Query | State management + API caching      |
| React Router 6            | Client-side routing                 |
| Tailwind CSS 3.4          | Utility-first styling               |
| PrimeReact 10.9           | Buttons, avatars, tags              |
| Material-UI 5.15          | Icons, supplementary components     |
| Storybook 7.6             | Component documentation & dev       |
| jsPDF                     | Client-side invoice PDF generation  |

### Backend

| Technology    | Purpose                               |
| ------------- | ------------------------------------- |
| Node.js 18+   | Runtime                               |
| Express 4.18  | HTTP framework                        |
| TypeScript 5  | Type safety                           |
| Mongoose 8.9  | MongoDB ODM                           |
| MongoDB Atlas | Cloud database (M0 free / M2-M5 prod) |
| Passport      | Google OAuth 2.0 strategy             |
| bcryptjs      | Password hashing                      |
| Stripe SDK    | Subscriptions + one-time payments     |
| SendGrid      | Transactional emails                  |
| Helmet        | Security headers                      |
| Compression   | Gzip responses                        |
| Vitest        | Test runner (jobs-services)           |

### DevOps

| Technology         | Purpose                                   |
| ------------------ | ----------------------------------------- |
| Docker + Compose   | Containerized backend services            |
| PM2                | Production process manager (cluster mode) |
| nginx              | Reverse proxy, SSL, static hosting        |
| Google Cloud (GCE) | Compute Engine VM (e2-medium)             |
| Let's Encrypt      | Auto-renewing SSL certificates            |
| GitHub             | Version control (6 repositories)          |

---

## Key Features

### Theme & Design System

- **Three theme modes** — Classic (Windows 97 retro), Modern (SaaS), Dark Pro
- **Dark mode** — Full CSS variable switching across all components
- **Theme customizer** — Slide-in panel with color picker, font size scaling
- **Redux-driven** — `themeSlice` stores mode, custom colors, and font settings

### Authentication & Authorization

- **JWT auth** — Access + refresh token pattern with automatic renewal
- **Google OAuth 2.0** — SSO via Passport, links with existing email-password accounts
- **RBAC** — Five roles: Candidate, Vendor, Employer, Marketer, Admin
- **Company RBAC** — Admin onboarding, employee invitations, department-scoped access

### Public Landing (Pre-Login)

- **Twin view** — Side-by-side jobs and candidate profiles
- **Candidate view** — Sorted by rate
- **Vendor view** — Candidate profiles by experience
- **Live polling** — HTTP polling every 30s with delta detection
- **Activity log** — Single-line bar showing real-time job/profile changes (new/update/delete) with flash animation

### Candidate Portal

- **Matched jobs** — Skill-based matching algorithm ranks jobs against candidate profile
- **Forwarded openings** — Employer-forwarded jobs with accept/decline flow
- **Poke inbox** — Rate-limited outreach notifications (email + in-platform)
- **Timesheets** — Track hours, view approved/submitted/draft entries
- **Financials** — Read-only view of project rates and payments
- **Resume** — Shareable public profile URL (`/resume/:username`) with PDF download
- **Onboarding flow** — Guided profile setup wizard
- **Profile update payment** — $3 one-time Stripe payment for visibility boost

### Employer Dashboard

- **Job postings** — Create, edit, manage listings with skills and requirements
- **Operations** — Admin controls, company setup, employee management
- **Roster management** — Invite candidates, forward openings, track statuses
- **Client/vendor management** — Manage relationships with client and vendor companies
- **Subscription plans** — Tiered plans (starter, growth, business, enterprise) with seat limits

### Financials (QuickBooks Pattern)

- **Project financials** — Bill/pay rates, margin calculations, US state tax rates
- **Invoices** — Generate and manage client invoices with PDF export
- **Bills** — Track vendor bills and payments
- **Payroll** — ADP People integration for payroll processing
- **Finance dashboard** — Company-wide financial summary and reporting

### Timesheets (Fieldglass Pattern)

- **Time entry** — Contractor hour tracking with approval workflow
- **Fieldglass sync** — Timesheet ingestion from SAP Fieldglass
- **Leave management** — PTO/leave tracking
- **Approval chain** — Draft → submitted → approved workflow

### Marketer Dashboard

- **Staffing workflows** — Manage candidate pipelines for multiple clients
- **Candidate sourcing** — Track accepted and pending invites

### Matching & Outreach

- **Skill-based matching** — Bidirectional ranking (candidate ↔ job)
- **Poke system** — Rate-limited notifications with monthly counters
- **Interview invites** — Schedule with Google Meet link integration

### Real-Time Data

- **HTTP polling** — 30-second interval with `changedJobIds`, `deletedJobIds`, `changedProfileIds`, `deletedProfileIds` delta tracking
- **SSE endpoint** — `/api/jobs/events` for live dashboard refresh after bulk ingest
- **Activity log** — Visual feed of recent changes (up to 50 entries, latest 6 displayed)

---

## Component Library

The `matchingdb-component-library` provides a shared design system consumed by both UIs via `npm link`.

### Components

| Category         | Components                                    |
| ---------------- | --------------------------------------------- |
| **Atomic**       | Button, Input, Select, Alert                  |
| **Data Display** | DataTable, MatchMeter, KpiCard, StatBar, Tabs |
| **Layout**       | Stack, Modal, Panel, Toolbar                  |
| **Status**       | TypePill, StatusBadge, ProgressBar            |
| **Forms**        | FormField, Input variants, Select             |
| **Utilities**    | Shimmer, EmptyState, Text, Footnote           |
| **Icons**        | Avatar, custom icon support                   |

### Exported Utilities

- `fmtCurrency()`, `fmtDate()`, `fmtNumber()` — Formatting helpers
- `useTheme()` — Hook returning current theme mode + resolved color scheme

### Style Layers

| File               | Purpose                         |
| ------------------ | ------------------------------- |
| `w97-theme.css`    | Classic Windows 97 color tokens |
| `w97-base.css`     | W97 component base styles       |
| `modern-theme.css` | SaaS-style modern theme tokens  |
| `aws-theme.css`    | AWS-inspired theme tokens       |
| `components.css`   | Component-specific styles       |
| `tailwind.css`     | Utility classes                 |
| `jobs/`, `shell/`  | Domain-specific style overrides |

Run Storybook for interactive docs:

```bash
cd matchingdb-component-library
npm run storybook    # http://localhost:6006
```

---

## API Reference

### Shell Services (`:8000`)

| Endpoint          | Controller           | Purpose                                 |
| ----------------- | -------------------- | --------------------------------------- |
| `/api/auth/*`     | auth.controller      | Register, login, logout, refresh, OAuth |
| `/api/payments/*` | payments.controller  | Stripe checkout, portal, webhooks       |
| `/api/user/*`     | user.controller      | Profile updates, preferences            |
| `/api/jobs/*`     | **→ proxy to :8001** | Gateway forwards to jobs-services       |
| `/api-docs`       | Swagger              | OpenAPI 3.0 interactive docs            |

### Jobs Services (`:8001`)

| Endpoint                     | Controller                    | Purpose                              |
| ---------------------------- | ----------------------------- | ------------------------------------ |
| `/api/jobs/*`                | jobs.controller               | CRUD, search, filtering, matching    |
| `/api/jobs/events`           | sse.service                   | Server-Sent Events for live data     |
| `/api/jobs/poll/public-data` | poll-public-data.service      | Polling with delta detection         |
| `/api/jobs/poll/counts`      | poll-counts.service           | Live job/profile counters            |
| `/api/employer/*`            | employer.controller           | Company, roster, invites, forwarding |
| `/api/financials/*`          | financials.controller         | Project rates, margins, tax          |
| `/api/employerFinancials/*`  | employerFinancials.controller | Employer financial reports           |
| `/api/timesheets/*`          | timesheets.routes             | Contractor hour tracking             |
| `/api/invoices/*`            | invoices.controller           | Invoice generation                   |
| `/api/bills/*`               | bills.controller              | Bill management                      |
| `/api/payroll/*`             | payroll.routes                | Payroll integration (ADP)            |
| `/api/vendors/*`             | vendors.controller            | Vendor company management            |
| `/api/clients/*`             | clients.controller            | Client company management            |
| `/api/fieldglass/*`          | fieldglass.controller         | Fieldglass timesheet sync            |
| `/api/interviews/*`          | interviews.routes             | Interview scheduling                 |
| `/api/candidateInvite/*`     | candidateInvite.routes        | Candidate invite system              |
| `/api/finance/*`             | finance.controller            | Finance dashboard                    |
| `/api/admin/*`               | admin.routes                  | Admin-only operations                |
| `/api/internal/*`            | internal.routes               | Internal service endpoints           |
| `/api-docs`                  | Swagger                       | OpenAPI 3.0 interactive docs         |

### Data Collection (`:5001`)

| Endpoint          | Purpose                       |
| ----------------- | ----------------------------- |
| `/api/auth`       | Admin authentication          |
| `/api/jobs`       | Bulk job ingestion            |
| `/api/candidates` | Bulk candidate ingestion      |
| `/api/ai-parse`   | AI-powered job data parsing   |
| `/api/templates`  | Ingestion template management |
| `/api/admin`      | Admin controls                |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**
- No local database needed — connects to **MongoDB Atlas** (cloud-hosted)

### 1. Clone all repositories

```powershell
mkdir MatchDB; cd MatchDB

git clone https://github.com/shakthimaharaja/matchdb-shell-services.git
git clone https://github.com/shakthimaharaja/matchdb-jobs-services.git
git clone https://github.com/shakthimaharaja/matchdb-shell-ui.git
git clone https://github.com/shakthimaharaja/matchdb-jobs-ui.git
git clone https://github.com/shakthimaharaja/matchingdb-component-library.git
git clone https://github.com/shakthimaharaja/matchdb-data-collection-mono.git
```

### 2. Install dependencies

```powershell
cd matchdb-shell-services;        npm install; cd ..
cd matchdb-jobs-services;         npm install; cd ..
cd matchingdb-component-library;  npm install; cd ..
cd matchdb-jobs-ui;               npm install; cd ..
cd matchdb-shell-ui;              npm install; cd ..
```

### 3. Seed the databases

```powershell
cd matchdb-shell-services;  npm run seed;  cd ..
cd matchdb-jobs-services;   npm run seed;  cd ..
```

Creates 15 users, 20 jobs, 10 candidate profiles, and all supporting data. See [Test Accounts](#test-accounts) for credentials.

### 4. Start the application

```powershell
.\start-matchdb.ps1
```

---

## Running Locally

### Option A — PowerShell script (recommended)

```powershell
.\start-matchdb.ps1
```

Kills any processes on required ports, then launches all four services in separate windows.

### Option B — VS Code tasks

Press `Ctrl+Shift+B` — the compound task **"Run All MatchingDB Services"** starts all services in parallel.

### Option C — Manual (four terminals)

```powershell
# Terminal 1 — Auth & Payments API
cd matchdb-shell-services;  npm run dev    # :8000

# Terminal 2 — Jobs & Matching API
cd matchdb-jobs-services;   npm run dev    # :8001

# Terminal 3 — Jobs UI (Remote MFE) — start BEFORE Shell UI
cd matchdb-jobs-ui;         npm run dev    # :3001

# Terminal 4 — Shell UI (Host MFE)
cd matchdb-shell-ui;        npm run dev    # :3000
```

> **Important:** Start Jobs UI (`:3001`) **before** Shell UI (`:3000`) — the Shell fetches `remoteEntry.js` from the Jobs remote at startup.

### Access URLs

| URL                            | Description                   |
| ------------------------------ | ----------------------------- |
| http://localhost:3000          | Main platform (Shell UI)      |
| http://localhost:8000/api-docs | Swagger — Auth & Payments API |
| http://localhost:8001/api-docs | Swagger — Jobs & Matching API |
| http://localhost:6006          | Storybook — Component Library |

---

## Test Accounts

Seeded by `npm run seed`.

### Admin accounts

| Email               | Password  | Role     | Plan     |
| ------------------- | --------- | -------- | -------- |
| admin@vendor.com    | admin@123 | Vendor   | pro_plus |
| admin@marketer.com  | admin@123 | Marketer | marketer |
| admin@markerter.com | admin@123 | Marketer | marketer |

### Test accounts

| Email                    | Password  | Role      | Plan  |
| ------------------------ | --------- | --------- | ----- |
| alice.johnson@test.com   | Test1234! | Candidate | free  |
| dave.brown@test.com      | Test1234! | Candidate | free  |
| emma.davis@test.com      | Test1234! | Candidate | free  |
| rahul.sharma@test.com    | Test1234! | Candidate | free  |
| priya.patel@test.com     | Test1234! | Candidate | free  |
| james.wilson@test.com    | Test1234! | Candidate | free  |
| sophia.martinez@test.com | Test1234! | Candidate | free  |
| liam.chen@test.com       | Test1234! | Candidate | free  |
| nina.gupta@test.com      | Test1234! | Candidate | free  |
| omar.hassan@test.com     | Test1234! | Candidate | free  |
| frank.miller@test.com    | Test1234! | Vendor    | pro   |
| sarah.lee@test.com       | Test1234! | Vendor    | basic |

### Seed data summary

| Collection          | Count | Notes                                 |
| ------------------- | ----- | ------------------------------------- |
| Users               | 15    | 3 admin + 10 candidates + 2 vendors   |
| Subscriptions       | 15    | One per user                          |
| Jobs                | 20    | Across 3 vendors, various types       |
| Candidate Profiles  | 10    | Full resumes with skills              |
| Applications        | 16    | Multiple statuses                     |
| Companies           | 2     | Alpha Staffing, Beta Tech Partners    |
| Marketer Candidates | 12    | Accepted + pending invites            |
| Poke Records        | 21    | Pokes + emails, all directions        |
| Poke Logs           | 13    | Monthly rate-limit counters           |
| Forwarded Openings  | 9     | Employer → candidate job forwards     |
| Company Invites     | 3     | Pending invitations                   |
| Project Financials  | 8     | Active + completed, with taxes        |
| Timesheets          | 16    | Approved, submitted, draft            |
| Interview Invites   | 8     | Pending + accepted                    |
| Subscription Plans  | 4     | Starter, growth, business, enterprise |

---

## Database

MongoDB Atlas cluster: `matchingdb.mrumkpb.mongodb.net`

| Database                  | Service         | Collections | Purpose                                                                                            |
| ------------------------- | --------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `matchingdb-shell`        | shell-services  | 4           | Users, Subscriptions, RefreshTokens, CandidatePayments                                             |
| `matchingdb-jobs`         | jobs-services   | 20          | Jobs, Profiles, Applications, Companies, Financials, Timesheets, Invoices, Bills, Interviews, etc. |
| `matchingdb_data_collection` | data-collection | varies      | Scraped/ingested job data                                                                       |

All models use `_id: String` (generated via `new ObjectId().toString()`). No `populate()` — relationships resolved via separate queries + Map lookups. All queries use `.lean()`.

See [DATABASE-SCHEMA.md](DATABASE-SCHEMA.md) for the full schema reference.

---

## Deployment

### Production Architecture

```
nginx (:443/:80)  — matchingdb.com
├── Static Shell UI dist/
├── Static Jobs UI dist/ (Module Federation)
└── Proxy /api/* → shell-services (:8000)
    └── Gateway proxies /api/jobs/* → jobs-services (:8001)

PM2 (cluster mode):
├── shell-services × 2 workers (:8000, 400MB max, 20 DB connections)
└── jobs-services  × 2 workers (:8001, 400MB max, 20 DB connections)
```

### Infrastructure

- **Host:** Google Cloud Compute Engine (e2-medium, Ubuntu 22.04, 30GB disk)
- **Database:** MongoDB Atlas (M0 free tier / M2–M5 production)
- **SSL:** Let's Encrypt with auto-renewal via Certbot
- **Process Manager:** PM2 cluster mode with log rotation
- **Reverse Proxy:** nginx with gzip (level 5), security headers, cache strategy
- **Cache Policy:** Hashed bundles → 1 year immutable; `remoteEntry.js` → no-cache (MFE hot-reload)

See [DEPLOY-GCP.md](DEPLOY-GCP.md) for the full step-by-step deployment guide.

---

## Project Structure

```
MatchDB/
├── matchdb-shell-ui/                  # Host MFE — Shell Application
│   ├── src/
│   │   ├── components/                # ShellLayout, ThemeCustomizer, LoginModal, JobsAppWrapper
│   │   ├── pages/                     # WelcomePage, PricingPage, OAuthCallbackPage, ResumeViewPage
│   │   ├── store/                     # authSlice (JWT/user), themeSlice (mode/colors/fonts)
│   │   ├── api/                       # shellApi.ts — RTK Query endpoints
│   │   └── styles/
│   └── webpack.config.js             # Module Federation host config
│
├── matchdb-jobs-ui/                   # Remote MFE — Jobs & Dashboards
│   ├── src/
│   │   ├── pages/
│   │   │   ├── candidate/             # CandidateDashboard, Onboarding, Payment, TimesheetView
│   │   │   ├── employer/              # EmployerDashboard, PostingsDashboard, OperationsDashboard
│   │   │   │   └── views/             # Bills, Payroll, Invoices, Fieldglass, Leave, Vendors, Clients
│   │   │   ├── marketer/              # MarketerDashboard
│   │   │   └── shared/                # PublicJobsView (twin/cand/vendor), MembershipGatePage
│   │   ├── api/                       # jobsApi.ts — RTK Query endpoints
│   │   ├── components/                # DataTable, ActivityLog, custom components
│   │   └── hooks/                     # useLiveRefresh, polling hooks
│   └── webpack.config.js             # Module Federation remote config
│
├── matchdb-shell-services/            # Auth & Payments API Gateway
│   ├── src/
│   │   ├── routes/                    # auth, payments, user
│   │   ├── controllers/               # auth, payments, preferences
│   │   ├── models/                    # User, Subscription, RefreshToken, CandidatePayment
│   │   ├── middleware/                # JWT auth, error handling
│   │   ├── services/                  # jwt, passport, stripe
│   │   ├── config/                    # env, mongoose, passport, swagger
│   │   └── scripts/                   # seed.ts, seed-bulk.ts
│   └── Dockerfile
│
├── matchdb-jobs-services/             # Jobs, Matching & Financials API
│   ├── src/
│   │   ├── routes/                    # jobs, employer, financials, timesheets, payroll, invoices,
│   │   │                              # bills, fieldglass, vendors, clients, interviews, admin
│   │   ├── controllers/               # Matching controllers for each route
│   │   ├── models/                    # Job, CandidateProfile, Application, Company, ProjectFinancial,
│   │   │                              # Timesheet, Invoice, Bill, InterviewInvite, etc. (20 models)
│   │   ├── services/                  # sse.service, poll-counts, poll-public-data
│   │   ├── config/
│   │   └── scripts/                   # seed, seed-bulk
│   └── Dockerfile
│
├── matchingdb-component-library/      # Shared Design System
│   ├── src/
│   │   ├── components/                # Button, Input, DataTable, MatchMeter, KpiCard, Modal, etc.
│   │   ├── styles/                    # w97-theme, modern-theme, aws-theme, components, tailwind
│   │   ├── theme/                     # ThemeContext.tsx, useTheme() hook
│   │   ├── icons/
│   │   └── utils/                     # fmtCurrency, fmtDate, fmtNumber
│   └── .storybook/
│
├── matchdb-data-collection-mono/      # Data Ingestion Tool (monorepo)
│   ├── server/                        # Express :5001 — upload, XLSX parse, AI parse, templates
│   └── client/                        # React + Vite :5173 — upload UI, validation, preview
│
├── docker-compose.yml                 # Containerized backend services
├── ecosystem.config.js                # PM2 production config (cluster mode)
├── nginx-matchingdb.conf              # Production reverse proxy + SSL
├── DEPLOY-GCP.md                      # Full deployment guide
├── DATABASE-SCHEMA.md                 # MongoDB collections reference
├── start-matchdb.ps1                  # Developer startup script
└── push-all.ps1                       # Git commit & push all repos
```

---

## Scripts

### Backend services (`shell-services`, `jobs-services`)

| Script          | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Start dev server with hot-reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/`                  |
| `npm start`     | Run compiled production build                  |
| `npm run seed`  | Seed the database with test data               |

### Frontend UIs (`shell-ui`, `jobs-ui`)

| Script          | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start webpack dev server |
| `npm run build` | Production webpack build |

### Component library

| Script              | Description                |
| ------------------- | -------------------------- |
| `npm run storybook` | Start Storybook on `:6006` |
| `npm run build`     | Build component library    |

### Workspace-level

| Script              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `start-matchdb.ps1` | Kill stale port processes + launch all 4 services |
| `push-all.ps1`      | Git add, commit & push across all repos at once   |

---

## Environment Variables

Each service reads from `env/.env.local`. Defaults are pre-configured — no changes needed for local dev.

| Service        | Key env vars                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------- |
| shell-services | `PORT=8000`, `MONGO_URI=mongodb+srv://...`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JOBS_SERVICES_URL` |
| jobs-services  | `PORT=8001`, `MONGO_URI=mongodb+srv://...`, `JWT_SECRET`                                            |
| shell-ui       | `SHELL_SERVICES_URL=http://localhost:8000`                                                          |
| jobs-ui        | (no env vars — webpack proxies to shell-services gateway)                                           |

> `JWT_SECRET` **must match** between shell-services and jobs-services since tokens are issued by shell-services and verified by jobs-services.

---

## Troubleshooting

| Issue                               | Fix                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `EADDRINUSE` on a port              | Kill the process: `netstat -ano \| findstr ":PORT"` then `Stop-Process -Id PID -Force` |
| Shell loads but Jobs panel is empty | Make sure Jobs UI is running on port 3001 first                                        |
| Login fails with 401                | Ensure shell-services is running and you've seeded the DB (`npm run seed`)             |
| MongoDB connection fails            | Check `MONGO_URI` in your env file and ensure Atlas cluster is accessible              |
| Stale data after re-seed            | Hard-refresh the browser (`Ctrl+Shift+R`) to clear cached state                        |

---

## License

MIT
