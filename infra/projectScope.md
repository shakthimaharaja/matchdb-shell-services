# Copilot Prompt: Workforce Management Platform Redesign

## ADP (People) + QuickBooks (Money) + Fieldglass (Timesheets)

> **Target:** Claude Opus 4.6 / GitHub Copilot
> **Context:** Existing codebase. Redesign using three enterprise patterns each owning a specific domain. Only TWO login portals — Candidate and Employer. All internal roles (admin, manager, vendor, marketer) use the Employer login.

---

## ARCHITECTURE — THE THREE PILLARS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YOUR APPLICATION                                     │
│                                                                             │
│                    ┌──────────────┐    ┌──────────────┐                     │
│                    │  CANDIDATE   │    │  EMPLOYER    │                     │
│                    │   LOGIN      │    │   LOGIN      │                     │
│                    └──────┬───────┘    └──────┬───────┘                     │
│                           │                   │                             │
│                           │           ┌───────┼────────────┐               │
│                           │           │       │            │               │
│                           │         Admin   Manager   Vendor  Marketer     │
│                           │                                (Accts/Immig/   │
│                           │                                 Placement)     │
│                           │                   │                             │
│         ┌─────────────────┼───────────────────┼─────────────────┐          │
│         │                 │                   │                 │          │
│         ▼                 ▼                   ▼                 ▼          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    ADP       │  │    ADP       │  │  QUICKBOOKS  │  │  FIELDGLASS  │    │
│  │  (Workers)   │  │ (Candidates) │  │   (Money)    │  │ (Timesheets) │    │
│  │             │  │             │  │              │  │              │    │
│  │ Profiles    │  │ Profiles    │  │ Client       │  │ Time entry   │    │
│  │ Onboarding  │  │ Applications│  │  invoicing   │  │ Approvals    │    │
│  │ Roles/Teams │  │ Placements  │  │ Vendor bills │  │ Hours tracked│    │
│  │ Payroll     │  │ Payroll     │  │ Payments     │  │ Overtime     │    │
│  │ Benefits    │  │ Documents   │  │ Expenses     │  │ PTO/Leave    │    │
│  │ Pay stubs   │  │ Pay stubs   │  │ Cash flow    │  │ Shift logs   │    │
│  │ Lifecycle   │  │ Lifecycle   │  │ Reports      │  │ Project time │    │
│  └─────────────┘  └─────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
│  PEOPLE ◄──────────────────────────► MONEY ◄─────────────► TIME            │
│  "Who do we manage?"                "Where does the        "How many hours  │
│  "What do we pay them?"              money come from?       did they work?"  │
│                                      Where does it go?"                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PILLAR 1 — ADP: THE PEOPLE ENGINE (Workers + Candidates)

### What ADP Owns

ADP Workforce Now manages the entire lifecycle of **people** — both workers (internal team) and candidates (external talent). Every person in the system, their profile, their employment status, their pay, their documents, their onboarding — all lives here.

### 1.1 Worker Management (ADP Pattern)

```
WORKER = An employer's internal team member (hired via invitation)

WORKER LIFECYCLE:
  INVITED → ONBOARDING → ACTIVE → ON_ASSIGNMENT → OFFBOARDING → TERMINATED

  INVITED:
    • Admin sends email invitation
    • Worker record created with status=INVITED
    • Invitation token generated (72hr expiry)

  ONBOARDING:
    • Worker accepts invitation, sets password
    • Completes profile (personal info, emergency contact, bank details)
    • Uploads documents (ID, tax forms W-4, I-9, direct deposit form)
    • Admin assigns role (Manager/Vendor/Marketer) and department
    • Admin assigns to team
    • Status → ONBOARDING

  ACTIVE:
    • Onboarding checklist complete
    • All required documents verified
    • Role and permissions activated
    • Can log into Employer portal and see their role-specific dashboard
    • Status → ACTIVE

  ON_ASSIGNMENT:
    • Assigned to specific project/client
    • Timesheets active (Fieldglass takes over tracking)
    • Status → ON_ASSIGNMENT

  OFFBOARDING:
    • Notice given or termination initiated
    • Access being revoked progressively
    • Final paycheck calculated
    • Equipment return tracked
    • Status → OFFBOARDING

  TERMINATED:
    • All access revoked
    • Account deactivated (soft delete — never hard delete)
    • Historical records preserved
    • Final pay stub generated
    • Status → TERMINATED

EVERY STATE CHANGE:
  → Logged in audit trail with who, when, why
  → Email notification sent
  → Dashboard widget updated
```

### 1.2 Candidate Management (ADP Pattern)

```
CANDIDATE = External talent that applies for jobs or is placed by the company

CANDIDATE LIFECYCLE:
  APPLIED → SCREENING → INTERVIEWED → OFFERED → PLACED → ACTIVE → COMPLETED → ARCHIVED

  APPLIED:
    • Candidate creates account via Candidate login
    • Submits application for a job posting
    • Uploads resume, cover letter

  SCREENING:
    • Employer (Vendor role) reviews application
    • Background check initiated
    • Skills assessment sent

  INTERVIEWED:
    • Interview scheduled and conducted
    • Feedback recorded

  OFFERED:
    • Offer letter generated
    • Pay rate, start date, project defined

  PLACED:
    • Candidate accepts offer
    • Assigned to a client project
    • Onboarding documents collected (W-4/W-9, I-9, direct deposit)

  ACTIVE:
    • Currently working on assignment
    • Submitting timesheets (Fieldglass takes over)
    • Receiving pay (ADP payroll processes it)

  COMPLETED:
    • Assignment ended
    • Final timesheet submitted and approved
    • Final paycheck processed
    • Available for re-placement

  ARCHIVED:
    • Inactive for 12+ months
    • Profile preserved for future opportunities
```

### 1.3 ADP-Style Payroll (Paying Workers + Candidates)

```
PAYROLL = The company paying its own people

WHO GETS PAID THROUGH PAYROLL:
  • Workers (W-2 employees) → Regular payroll with tax withholding
  • Candidates (1099 contractors) → Contract pay based on timesheets

PAYROLL FLOW (QuickBooks-style 4-step wizard inside the ADP people module):

  STEP 1: SELECT PAY PERIOD
  ┌────────────────────────────────────────────────────┐
  │  Pay Period: Mar 16 – Mar 31, 2026                 │
  │  Pay Date:   Apr 5, 2026                           │
  │  Type:       ○ Regular   ○ Bonus   ○ Off-cycle     │
  │                                                    │
  │  Include:    ☑ Workers (W-2)                       │
  │              ☑ Candidates (1099)                    │
  └────────────────────────────────────────────────────┘

  STEP 2: REVIEW HOURS & EARNINGS
  ┌────────────────────────────────────────────────────┐
  │  ⬇ Data pulled from FIELDGLASS timesheets          │
  │                                                    │
  │  Name           Type   Hours  Rate    Gross        │
  │  ────────────── ────── ────── ─────── ────────     │
  │  Sarah Chen     W-2    80     $55/hr  $4,400       │
  │  Mike Ross      W-2    84     $48/hr  $4,128*      │
  │  Carlos Reyes   1099   76     $42/hr  $3,192       │
  │  Mei Zhang      1099   80     $50/hr  $4,000       │
  │                                                    │
  │  * ⚠ 4 hrs overtime detected                       │
  │                                                    │
  │  [ Edit ]  [ Add Bonus ]  [ Add Deduction ]        │
  └────────────────────────────────────────────────────┘

  STEP 3: REVIEW DEDUCTIONS & TAXES
  ┌────────────────────────────────────────────────────┐
  │  W-2 EMPLOYEES:                                    │
  │  Federal W/H:    $1,240.00                         │
  │  State Tax:      $480.00                           │
  │  FICA (SS):      $528.72                           │
  │  FICA (Medicare): $123.65                          │
  │  Health Ins:     $500.00                           │
  │  401k:           $340.00                           │
  │                                                    │
  │  1099 CONTRACTORS:                                 │
  │  No withholding (contractor responsibility)        │
  │  Flat payment based on approved timesheets         │
  │                                                    │
  │  Total Gross:       $15,720.00                     │
  │  Total Deductions:  $3,212.37  (W-2 only)         │
  │  Total Net Pay:     $12,507.63                     │
  └────────────────────────────────────────────────────┘

  STEP 4: APPROVE & PROCESS
  ┌────────────────────────────────────────────────────┐
  │  ┌──────────────────────────────────────────┐      │
  │  │      APPROVE & PROCESS PAYROLL           │      │
  │  └──────────────────────────────────────────┘      │
  │                                                    │
  │  [ Save Draft ]  [ Schedule for Later ]            │
  │                                                    │
  │  After processing:                                 │
  │  → Pay stubs generated (PDF)                       │
  │  → Direct deposits scheduled                       │
  │  → Candidates can view stubs in Candidate portal   │
  │  → Workers can view stubs in Employer portal       │
  │  → Audit log entry created                         │
  └────────────────────────────────────────────────────┘

APPROVAL CHAIN:
  If created by Finance Team (Marketer-Accounts):
    Finance creates → submits → Employer Admin approves → processed
  If created by Employer Admin:
    Admin creates → auto-approved (logged) → processed
```

### 1.4 ADP Database Schema

```sql
-- Workers (employer's internal team — use existing employer_users table)
-- employer_users table already has: id, company_id, email, role, department, status
-- ADD these columns to employer_users:
ALTER TABLE employer_users ADD COLUMN employment_type VARCHAR(10) DEFAULT 'W2';
ALTER TABLE employer_users ADD COLUMN hourly_rate DECIMAL(10,2);
ALTER TABLE employer_users ADD COLUMN salary_amount DECIMAL(10,2);
ALTER TABLE employer_users ADD COLUMN pay_frequency VARCHAR(20);  -- WEEKLY, BIWEEKLY, MONTHLY
ALTER TABLE employer_users ADD COLUMN bank_account_info JSONB;    -- encrypted
ALTER TABLE employer_users ADD COLUMN tax_info JSONB;             -- W-4 data, encrypted
ALTER TABLE employer_users ADD COLUMN benefits_enrolled JSONB;
ALTER TABLE employer_users ADD COLUMN onboarding_checklist JSONB;
ALTER TABLE employer_users ADD COLUMN lifecycle_status VARCHAR(30) DEFAULT 'INVITED';
  -- INVITED, ONBOARDING, ACTIVE, ON_ASSIGNMENT, OFFBOARDING, TERMINATED

-- Candidates (already exists — ADD these columns):
ALTER TABLE candidates ADD COLUMN contractor_type VARCHAR(10) DEFAULT '1099';
ALTER TABLE candidates ADD COLUMN hourly_rate DECIMAL(10,2);
ALTER TABLE candidates ADD COLUMN placement_status VARCHAR(30) DEFAULT 'APPLIED';
  -- APPLIED, SCREENING, INTERVIEWED, OFFERED, PLACED, ACTIVE, COMPLETED, ARCHIVED
ALTER TABLE candidates ADD COLUMN assigned_project_id UUID;
ALTER TABLE candidates ADD COLUMN assigned_client_id UUID;
ALTER TABLE candidates ADD COLUMN bank_account_info JSONB;
ALTER TABLE candidates ADD COLUMN tax_info JSONB;      -- W-9 data
ALTER TABLE candidates ADD COLUMN onboarding_docs JSONB;

-- Pay periods
CREATE TABLE pay_periods (
  id              UUID PRIMARY KEY,
  company_id      UUID REFERENCES companies(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  pay_date        DATE NOT NULL,
  frequency       VARCHAR(20),  -- WEEKLY, BIWEEKLY, SEMI_MONTHLY, MONTHLY
  status          VARCHAR(20) DEFAULT 'DRAFT',
  -- DRAFT, IN_REVIEW, APPROVED, PROCESSED, VOIDED
  created_by      UUID NOT NULL,
  approved_by     UUID,
  processed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Individual pay records (one per person per pay period)
CREATE TABLE payroll_records (
  id              UUID PRIMARY KEY,
  pay_period_id   UUID REFERENCES pay_periods(id),
  payee_id        UUID NOT NULL,
  payee_type      VARCHAR(10) NOT NULL,  -- 'WORKER' or 'CANDIDATE'
  company_id      UUID REFERENCES companies(id),

  -- Hours (pulled from Fieldglass timesheets)
  regular_hours   DECIMAL(6,2) DEFAULT 0,
  overtime_hours  DECIMAL(6,2) DEFAULT 0,
  pto_hours       DECIMAL(6,2) DEFAULT 0,
  hourly_rate     DECIMAL(10,2),
  salary_amount   DECIMAL(10,2),

  -- Earnings
  gross_pay       DECIMAL(10,2) NOT NULL,
  bonus           DECIMAL(10,2) DEFAULT 0,
  commission      DECIMAL(10,2) DEFAULT 0,
  reimbursements  DECIMAL(10,2) DEFAULT 0,

  -- Deductions (W-2 only, zero for 1099)
  federal_tax     DECIMAL(10,2) DEFAULT 0,
  state_tax       DECIMAL(10,2) DEFAULT 0,
  local_tax       DECIMAL(10,2) DEFAULT 0,
  fica_ss         DECIMAL(10,2) DEFAULT 0,
  fica_medicare   DECIMAL(10,2) DEFAULT 0,
  health_insurance DECIMAL(10,2) DEFAULT 0,
  dental_insurance DECIMAL(10,2) DEFAULT 0,
  vision_insurance DECIMAL(10,2) DEFAULT 0,
  retirement_401k DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) NOT NULL,

  -- Net
  net_pay         DECIMAL(10,2) NOT NULL,

  -- Employer costs (W-2 only)
  employer_fica   DECIMAL(10,2) DEFAULT 0,
  employer_futa   DECIMAL(10,2) DEFAULT 0,
  employer_suta   DECIMAL(10,2) DEFAULT 0,
  employer_benefits DECIMAL(10,2) DEFAULT 0,

  -- Payment
  payment_method  VARCHAR(20),  -- DIRECT_DEPOSIT, CHECK, WIRE
  payment_status  VARCHAR(20) DEFAULT 'PENDING',

  -- Link back to Fieldglass timesheet
  timesheet_id    UUID REFERENCES timesheets(id),

  created_at      TIMESTAMP DEFAULT NOW()
);

-- Pay stubs
CREATE TABLE pay_stubs (
  id                UUID PRIMARY KEY,
  payroll_record_id UUID REFERENCES payroll_records(id),
  payee_id          UUID NOT NULL,
  payee_type        VARCHAR(10) NOT NULL,
  stub_number       VARCHAR(50) UNIQUE,
  pdf_url           VARCHAR(500),
  is_viewed         BOOLEAN DEFAULT FALSE,
  generated_at      TIMESTAMP DEFAULT NOW()
);
```

---

## PILLAR 2 — QUICKBOOKS: THE MONEY ENGINE (Clients + Vendors)

### What QuickBooks Owns

QuickBooks manages the **company's money** — money coming IN from clients and money going OUT to vendors. This is NOT payroll (ADP handles payroll). This is business finance: invoicing clients for services, paying vendor bills, tracking expenses, managing cash flow.

### 2.1 The Money Flow

```
THE COMPANY'S MONEY FLOW:

  MONEY IN (Accounts Receivable):
  ═══════════════════════════════
  Clients pay the company for staffing/placement services

    Client hires candidate through your platform
         │
         ▼
    Company invoices the client (e.g., $85/hr × 160 hrs = $13,600)
         │
         ▼
    Client pays the invoice
         │
         ▼
    Payment recorded → AR balance reduced → Cash increases


  MONEY OUT (Accounts Payable):
  ═════════════════════════════
  Company pays vendors for services/supplies

    Company receives vendor bill (office rent, software, insurance, etc.)
         │
         ▼
    Bill entered into system with due date and terms
         │
         ▼
    Bill approved by Admin or Finance team
         │
         ▼
    Payment sent to vendor → AP balance reduced → Cash decreases


  MONEY OUT (Payroll — bridges to ADP):
  ═════════════════════════════════════
  Company pays workers and candidates

    ADP processes payroll (see Pillar 1)
         │
         ▼
    Payroll totals flow into QuickBooks as expense entries
         │
         ▼
    Payroll expense recorded → Cash decreases


  THE MARGIN:
  ═══════════
    Client pays company:    $85/hr
    Company pays candidate: $42/hr
    ─────────────────────────────
    Gross margin:           $43/hr (50.6%)

    This margin tracking is a CORE QuickBooks feature.
```

### 2.2 Client Management (Accounts Receivable)

```
CLIENT = A business that hires candidates through your company

CLIENT LIFECYCLE:
  PROSPECT → ACTIVE → ON_HOLD → CHURNED

CLIENT RECORD:
  • Company name, address, contact person
  • Payment terms (Net 15, Net 30, Net 45, Net 60)
  • Credit limit
  • Tax ID
  • Billing contact (separate from primary contact)
  • Rate card (what you charge this client per role/candidate)
  • Active placements (which candidates are placed there)
  • Invoice history
  • Outstanding balance

INVOICING FLOW (QuickBooks Pattern):

  Step 1: CREATE INVOICE
  ┌────────────────────────────────────────────────────────────┐
  │  NEW INVOICE                                     #INV-0042│
  │                                                            │
  │  Client:     [ Acme Corp                    ▼ ]            │
  │  Date:       03/31/2026                                    │
  │  Due Date:   04/30/2026  (Net 30)                          │
  │  PO Number:  PO-2026-118                                   │
  │                                                            │
  │  ┌────────────────────────────────────────────────────┐    │
  │  │ Line Items                                         │    │
  │  │                                                    │    │
  │  │ Description          Hours  Rate     Amount        │    │
  │  │ ──────────────────── ────── ──────── ──────────    │    │
  │  │ Carlos Reyes         160    $85/hr   $13,600.00    │    │
  │  │  Sr. Developer                                     │    │
  │  │  Period: 03/01-03/31                               │    │
  │  │                                                    │    │
  │  │ Mei Zhang            152    $75/hr   $11,400.00    │    │
  │  │  QA Engineer                                       │    │
  │  │  Period: 03/01-03/31                               │    │
  │  │                                                    │    │
  │  │ ───────────────────────────────────────────────    │    │
  │  │ Subtotal:                          $25,000.00      │    │
  │  │ Tax (if applicable):               $0.00           │    │
  │  │ TOTAL:                             $25,000.00      │    │
  │  └────────────────────────────────────────────────────┘    │
  │                                                            │
  │  ⬆ Hours pulled from FIELDGLASS approved timesheets        │
  │                                                            │
  │  [ Save Draft ]  [ Send Invoice ]  [ Download PDF ]        │
  └────────────────────────────────────────────────────────────┘

  Step 2: SEND TO CLIENT
    → Email invoice PDF to client billing contact
    → Status: SENT
    → AR balance increases

  Step 3: TRACK PAYMENT
    → Client pays (check, ACH, wire)
    → Record payment against invoice
    → Partial payments supported
    → Status: PAID (or PARTIAL)
    → AR balance decreases

  Step 4: AGING REPORT
    → Track overdue invoices
    → Current / 1-30 days / 31-60 days / 61-90 days / 90+ days
    → Auto-reminders for overdue invoices
```

### 2.3 Vendor Management (Accounts Payable)

```
VENDOR = A business or person your company pays for goods/services
         (NOT candidates — they are paid through ADP payroll)

EXAMPLES OF VENDORS:
  • Office landlord (rent)
  • Software subscriptions (AWS, GitHub, Slack)
  • Insurance provider
  • Legal counsel
  • Accounting firm
  • Equipment suppliers
  • Subcontractors (other staffing agencies you partner with)
  • Background check services
  • Job board fees (Indeed, LinkedIn)

VENDOR BILL FLOW (QuickBooks Pattern):

  Step 1: RECEIVE BILL
  ┌────────────────────────────────────────────────────────────┐
  │  NEW BILL                                                  │
  │                                                            │
  │  Vendor:      [ CloudHost Inc.              ▼ ]            │
  │  Bill #:      VB-2026-0089                                 │
  │  Bill Date:   03/25/2026                                   │
  │  Due Date:    04/24/2026  (Net 30)                         │
  │  Category:    [ Software & SaaS             ▼ ]            │
  │                                                            │
  │  Description                         Amount                │
  │  ──────────────────────────────────  ──────────            │
  │  AWS hosting — March 2026            $2,400.00             │
  │  SSL certificate renewal             $150.00               │
  │  ───────────────────────────────────────────────           │
  │  TOTAL:                              $2,550.00             │
  │                                                            │
  │  Attachment: [ Upload Bill PDF ]                           │
  │                                                            │
  │  [ Save ]  [ Submit for Approval ]                         │
  └────────────────────────────────────────────────────────────┘

  Step 2: APPROVAL
    → Finance team reviews bill
    → Matches to PO (if applicable)
    → Admin approves
    → Status: APPROVED

  Step 3: PAYMENT
    → Schedule payment (ACH, check, wire, credit card)
    → Record payment date and method
    → Status: PAID
    → AP balance decreases

  Step 4: RECONCILIATION
    → Match payments to bank transactions
    → Flag discrepancies
    → Generate AP aging report
```

### 2.4 QuickBooks Financial Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│  FINANCE DASHBOARD                                    March 2026     │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ Revenue (MTD)│  │ Expenses     │  │ Payroll      │  │ Profit  │ │
│  │ $142,500     │  │ $18,400      │  │ $89,200      │  │ $34,900 │ │
│  │ ▲ 12% vs Feb │  │ ▼ 3% vs Feb │  │ ▲ 5% vs Feb │  │ ▲ 8%   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│                                                                      │
│  ┌───────────────────────────────┐  ┌──────────────────────────────┐│
│  │ ACCOUNTS RECEIVABLE           │  │ ACCOUNTS PAYABLE             ││
│  │                               │  │                              ││
│  │ Outstanding:    $67,200       │  │ Outstanding:    $12,800      ││
│  │ Current:        $42,000       │  │ Current:        $8,200       ││
│  │ 1-30 days:      $18,000      │  │ 1-30 days:      $3,400       ││
│  │ 31-60 days:     $5,200       │  │ 31-60 days:     $1,200       ││
│  │ 61-90 days:     $2,000       │  │ 61+ days:       $0           ││
│  │                               │  │                              ││
│  │ [ View All Invoices ]         │  │ [ View All Bills ]           ││
│  └───────────────────────────────┘  └──────────────────────────────┘│
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ CASH FLOW (6 Months)                                            ││
│  │                                                                  ││
│  │  $150K ┤                         ╱╲                             ││
│  │  $120K ┤              ╱╲        ╱  ╲    ╱                      ││
│  │  $90K  ┤        ╱╲  ╱  ╲  ╱╲  ╱    ╲╱                        ││
│  │  $60K  ┤   ╱╲  ╱  ╲╱    ╲╱  ╲╱                               ││
│  │  $30K  ┤  ╱  ╲╱                         ── Revenue (in)        ││
│  │  $0    ┤╱                                ── Expenses (out)     ││
│  │        └──────────────────────────────                          ││
│  │         Oct  Nov  Dec  Jan  Feb  Mar                            ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ PROFIT MARGIN PER CANDIDATE                                     ││
│  │                                                                  ││
│  │ Candidate        Client Rate  Pay Rate  Margin  Margin %        ││
│  │ ──────────────── ─────────── ───────── ─────── ────────         ││
│  │ Carlos Reyes     $85/hr      $42/hr    $43/hr  50.6%           ││
│  │ Mei Zhang        $75/hr      $50/hr    $25/hr  33.3%           ││
│  │ Aisha Khan       $90/hr      $48/hr    $42/hr  46.7%           ││
│  │                                                                  ││
│  │ Average Margin:  $36.67/hr  (43.5%)                             ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  QUICK ACTIONS:                                                      │
│  [ Create Invoice ] [ Enter Bill ] [ Record Payment ] [ Run Report ] │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.5 QuickBooks Database Schema

```sql
-- Clients (businesses that pay your company)
CREATE TABLE clients (
  id              UUID PRIMARY KEY,
  company_id      UUID REFERENCES companies(id),  -- which employer company owns this client
  name            VARCHAR(255) NOT NULL,
  legal_name      VARCHAR(255),
  address         JSONB,
  phone           VARCHAR(20),
  email           VARCHAR(255),
  billing_email   VARCHAR(255),
  billing_contact VARCHAR(255),
  payment_terms   VARCHAR(20) DEFAULT 'NET_30',  -- NET_15, NET_30, NET_45, NET_60
  credit_limit    DECIMAL(12,2),
  tax_id          VARCHAR(20),
  status          VARCHAR(20) DEFAULT 'ACTIVE',  -- PROSPECT, ACTIVE, ON_HOLD, CHURNED
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Client rate cards (what you charge per role/candidate)
CREATE TABLE client_rate_cards (
  id              UUID PRIMARY KEY,
  client_id       UUID REFERENCES clients(id),
  candidate_id    UUID REFERENCES candidates(id),  -- NULL if role-based rate
  job_title       VARCHAR(255),
  bill_rate       DECIMAL(10,2) NOT NULL,  -- what client pays per hour
  pay_rate        DECIMAL(10,2) NOT NULL,  -- what candidate gets per hour
  margin          DECIMAL(10,2) GENERATED ALWAYS AS (bill_rate - pay_rate) STORED,
  margin_percent  DECIMAL(5,2) GENERATED ALWAYS AS
                    (CASE WHEN bill_rate > 0 THEN ((bill_rate - pay_rate) / bill_rate) * 100 ELSE 0 END) STORED,
  effective_from  DATE DEFAULT CURRENT_DATE,
  effective_to    DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Invoices (company bills clients)
CREATE TABLE invoices (
  id              UUID PRIMARY KEY,
  company_id      UUID REFERENCES companies(id),
  client_id       UUID REFERENCES clients(id),
  invoice_number  VARCHAR(50) UNIQUE NOT NULL,
  po_number       VARCHAR(50),
  invoice_date    DATE NOT NULL,
  due_date        DATE NOT NULL,
  subtotal        DECIMAL(12,2) NOT NULL,
  tax_amount      DECIMAL(12,2) DEFAULT 0,
  total_amount    DECIMAL(12,2) NOT NULL,
  amount_paid     DECIMAL(12,2) DEFAULT 0,
  balance_due     DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status          VARCHAR(20) DEFAULT 'DRAFT',
  -- DRAFT, SENT, VIEWED, PARTIAL, PAID, OVERDUE, VOID, WRITE_OFF
  notes           TEXT,
  pdf_url         VARCHAR(500),
  sent_at         TIMESTAMP,
  paid_at         TIMESTAMP,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_line_items (
  id              UUID PRIMARY KEY,
  invoice_id      UUID REFERENCES invoices(id) ON DELETE CASCADE,
  candidate_id    UUID REFERENCES candidates(id),
  description     TEXT NOT NULL,
  hours           DECIMAL(6,2),
  rate            DECIMAL(10,2),
  amount          DECIMAL(12,2) NOT NULL,
  period_start    DATE,
  period_end      DATE,
  timesheet_id    UUID REFERENCES timesheets(id),  -- link to Fieldglass
  sort_order      INT DEFAULT 0
);

-- Invoice payments (client pays company)
CREATE TABLE invoice_payments (
  id              UUID PRIMARY KEY,
  invoice_id      UUID REFERENCES invoices(id),
  payment_date    DATE NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  payment_method  VARCHAR(30),  -- ACH, WIRE, CHECK, CREDIT_CARD
  reference_number VARCHAR(50), -- check number, transaction ID
  notes           TEXT,
  recorded_by     UUID NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Vendors (businesses your company pays)
CREATE TABLE vendors (
  id              UUID PRIMARY KEY,
  company_id      UUID REFERENCES companies(id),
  name            VARCHAR(255) NOT NULL,
  contact_name    VARCHAR(255),
  email           VARCHAR(255),
  phone           VARCHAR(20),
  address         JSONB,
  payment_terms   VARCHAR(20) DEFAULT 'NET_30',
  tax_id          VARCHAR(20),
  category        VARCHAR(100),  -- SOFTWARE, RENT, INSURANCE, LEGAL, etc.
  status          VARCHAR(20) DEFAULT 'ACTIVE',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Vendor bills (vendors bill your company)
CREATE TABLE vendor_bills (
  id              UUID PRIMARY KEY,
  company_id      UUID REFERENCES companies(id),
  vendor_id       UUID REFERENCES vendors(id),
  bill_number     VARCHAR(50),
  bill_date       DATE NOT NULL,
  due_date        DATE NOT NULL,
  category        VARCHAR(100),
  description     TEXT,
  total_amount    DECIMAL(12,2) NOT NULL,
  amount_paid     DECIMAL(12,2) DEFAULT 0,
  balance_due     DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status          VARCHAR(20) DEFAULT 'PENDING',
  -- PENDING, APPROVED, SCHEDULED, PAID, OVERDUE, VOID
  attachment_url  VARCHAR(500),
  approved_by     UUID,
  approved_at     TIMESTAMP,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Vendor bill payments (company pays vendors)
CREATE TABLE vendor_bill_payments (
  id              UUID PRIMARY KEY,
  bill_id         UUID REFERENCES vendor_bills(id),
  payment_date    DATE NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  payment_method  VARCHAR(30),
  reference_number VARCHAR(50),
  recorded_by     UUID NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Expense categories (chart of accounts — simplified)
CREATE TABLE expense_categories (
  id              UUID PRIMARY KEY,
  company_id      UUID REFERENCES companies(id),
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(20) NOT NULL,  -- REVENUE, EXPENSE, PAYROLL, TAX
  parent_id       UUID REFERENCES expense_categories(id),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## PILLAR 3 — FIELDGLASS: THE TIMESHEET ENGINE (Workers + Candidates)

### What Fieldglass Owns

SAP Fieldglass manages **time** — tracking every hour worked by every worker and candidate. Timesheets are the bridge between ADP (who gets paid) and QuickBooks (client invoicing). Approved hours flow into both systems.

### 3.1 How Timesheets Connect Everything

```
FIELDGLASS is the SINGLE SOURCE OF TRUTH for hours worked.

  Worker/Candidate submits timesheet in FIELDGLASS
       │
       ├──────────► ADP PAYROLL
       │            "Pay this person $X for Y hours"
       │            (gross pay, deductions, net pay, pay stub)
       │
       └──────────► QUICKBOOKS INVOICING
                    "Bill this client $X for Y hours"
                    (invoice line item with bill rate × hours)

  Example:
    Carlos Reyes submits 160 hours for March on Project Alpha (Acme Corp client)
         │
         ├──► ADP: Pay Carlos 160 hrs × $42/hr = $6,720 (his pay rate)
         │
         └──► QuickBooks: Invoice Acme Corp 160 hrs × $85/hr = $13,600 (client bill rate)
              Margin: $13,600 - $6,720 = $6,880 (50.6%)
```

### 3.2 Timesheet Lifecycle

```
TIMESHEET STATES:
  DRAFT → SUBMITTED → APPROVED → REJECTED → PROCESSED

  DRAFT:
    • Worker/candidate fills in daily hours
    • Can save and come back
    • Not visible to approver yet

  SUBMITTED:
    • Worker clicks "Submit Timesheet"
    • Locked from editing
    • Notification sent to approver
    • Approver = Manager or Vendor role (for candidates on their projects)

  APPROVED:
    • Approver reviews and approves
    • Hours become official
    • Feeds into ADP payroll calculations
    • Feeds into QuickBooks invoice generation
    • Cannot be edited (only voided and resubmitted)

  REJECTED:
    • Approver rejects with reason
    • Unlocked for worker/candidate to edit
    • Status returns to DRAFT

  PROCESSED:
    • Timesheet hours have been used in a payroll run AND/OR an invoice
    • Final state — historical record
    • Cannot be voided after processing
```

### 3.3 Timesheet UI (Fieldglass Pattern)

```
WEEKLY TIMESHEET VIEW:
┌──────────────────────────────────────────────────────────────────────┐
│  TIMESHEET — Carlos Reyes                  Week: Mar 25 – Mar 31    │
│  Project: Alpha Migration    Client: Acme Corp                      │
│                                                                      │
│  ┌──────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬──────────┐ │
│  │ Category │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │ Total    │ │
│  ├──────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼──────────┤ │
│  │ Regular  │ 8   │ 8   │ 8   │ 8   │ 8   │ 0   │ 0   │ 40.0 hrs│ │
│  │ Overtime │ 0   │ 1   │ 0   │ 1.5 │ 0   │ 0   │ 0   │ 2.5 hrs │ │
│  │ PTO      │ 0   │ 0   │ 0   │ 0   │ 0   │ 0   │ 0   │ 0.0 hrs │ │
│  │ Sick     │ 0   │ 0   │ 0   │ 0   │ 0   │ 0   │ 0   │ 0.0 hrs │ │
│  │ Holiday  │ 0   │ 0   │ 0   │ 0   │ 0   │ 0   │ 0   │ 0.0 hrs │ │
│  ├──────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼──────────┤ │
│  │ DAILY    │ 8   │ 9   │ 8   │ 9.5 │ 8   │ 0   │ 0   │ 42.5 hrs│ │
│  │ TOTAL    │     │     │     │     │     │     │     │          │ │
│  └──────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴──────────┘ │
│                                                                      │
│  Notes: "Worked extra on DB migration Tue and schema review Thu"     │
│                                                                      │
│  Status: DRAFT                                                       │
│                                                                      │
│  [ Save Draft ]         [ Submit for Approval ]                      │
└──────────────────────────────────────────────────────────────────────┘


APPROVAL VIEW (Manager/Vendor sees):
┌──────────────────────────────────────────────────────────────────────┐
│  PENDING APPROVALS                              3 timesheets        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Carlos Reyes — Week Mar 25–31                                 │  │
│  │ Project: Alpha Migration (Acme Corp)                          │  │
│  │ Regular: 40 hrs  |  Overtime: 2.5 hrs  |  Total: 42.5 hrs    │  │
│  │                                                               │  │
│  │ [ View Details ]    [ Approve ✓ ]    [ Reject ✗ ]            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Mei Zhang — Week Mar 25–31                                    │  │
│  │ Project: Beta Testing (TechFlow Inc)                          │  │
│  │ Regular: 40 hrs  |  Overtime: 0 hrs  |  Total: 40 hrs        │  │
│  │                                                               │  │
│  │ [ View Details ]    [ Approve ✓ ]    [ Reject ✗ ]            │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.4 Fieldglass Database Schema

```sql
-- Timesheets (one per person per week)
CREATE TABLE timesheets (
  id              UUID PRIMARY KEY,
  company_id      UUID REFERENCES companies(id),
  submitter_id    UUID NOT NULL,
  submitter_type  VARCHAR(10) NOT NULL,  -- 'WORKER' or 'CANDIDATE'
  project_id      UUID REFERENCES projects(id),
  client_id       UUID REFERENCES clients(id),       -- for invoice generation
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'DRAFT',
  -- DRAFT, SUBMITTED, APPROVED, REJECTED, PROCESSED
  submitted_at    TIMESTAMP,
  approved_by     UUID,
  approved_at     TIMESTAMP,
  rejected_by     UUID,
  rejected_at     TIMESTAMP,
  rejection_reason TEXT,
  processed_in_payroll_id  UUID REFERENCES pay_periods(id),
  processed_in_invoice_id  UUID REFERENCES invoices(id),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE(submitter_id, submitter_type, week_start)  -- one timesheet per person per week
);

-- Daily time entries (7 rows per timesheet, one per day)
CREATE TABLE time_entries (
  id              UUID PRIMARY KEY,
  timesheet_id    UUID REFERENCES timesheets(id) ON DELETE CASCADE,
  entry_date      DATE NOT NULL,
  day_of_week     VARCHAR(10) NOT NULL,  -- MONDAY, TUESDAY, etc.
  regular_hours   DECIMAL(4,2) DEFAULT 0,
  overtime_hours  DECIMAL(4,2) DEFAULT 0,
  pto_hours       DECIMAL(4,2) DEFAULT 0,
  sick_hours      DECIMAL(4,2) DEFAULT 0,
  holiday_hours   DECIMAL(4,2) DEFAULT 0,
  total_hours     DECIMAL(4,2) GENERATED ALWAYS AS
                    (regular_hours + overtime_hours + pto_hours + sick_hours + holiday_hours) STORED,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE(timesheet_id, entry_date)
);

-- Timesheet summary (computed from time_entries, updated on save)
CREATE TABLE timesheet_summaries (
  id              UUID PRIMARY KEY,
  timesheet_id    UUID REFERENCES timesheets(id) ON DELETE CASCADE UNIQUE,
  total_regular   DECIMAL(6,2) DEFAULT 0,
  total_overtime  DECIMAL(6,2) DEFAULT 0,
  total_pto       DECIMAL(6,2) DEFAULT 0,
  total_sick      DECIMAL(6,2) DEFAULT 0,
  total_holiday   DECIMAL(6,2) DEFAULT 0,
  total_hours     DECIMAL(6,2) DEFAULT 0,
  pay_rate        DECIMAL(10,2),  -- from ADP (worker/candidate rate)
  bill_rate       DECIMAL(10,2),  -- from QuickBooks (client rate card)
  estimated_pay   DECIMAL(10,2),  -- total_hours × pay_rate
  estimated_bill  DECIMAL(10,2),  -- total_hours × bill_rate
  estimated_margin DECIMAL(10,2), -- estimated_bill - estimated_pay
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- PTO / Leave balances
CREATE TABLE leave_balances (
  id              UUID PRIMARY KEY,
  person_id       UUID NOT NULL,
  person_type     VARCHAR(10) NOT NULL,  -- 'WORKER' or 'CANDIDATE'
  company_id      UUID REFERENCES companies(id),
  leave_type      VARCHAR(20) NOT NULL,  -- PTO, SICK, PERSONAL, VACATION
  annual_allowance DECIMAL(6,2),
  used            DECIMAL(6,2) DEFAULT 0,
  remaining       DECIMAL(6,2) GENERATED ALWAYS AS (annual_allowance - used) STORED,
  year            INT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Timesheet audit log
CREATE TABLE timesheet_audit_log (
  id              UUID PRIMARY KEY,
  timesheet_id    UUID REFERENCES timesheets(id),
  action          VARCHAR(30) NOT NULL,
  -- CREATED, SAVED, SUBMITTED, APPROVED, REJECTED, VOIDED, PROCESSED
  performed_by    UUID NOT NULL,
  performer_role  VARCHAR(50),
  details         JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## LOGIN & ROLE-BASED ACCESS

### Only Two Logins

```
LOGIN 1: CANDIDATE
  → /login/candidate
  → Sees: Jobs, My Applications, My Profile, My Timesheets, My Pay Stubs

LOGIN 2: EMPLOYER
  → /login/employer
  → After login, role determines what they see:

     ADMIN:
       ADP:        Full access (all workers, all candidates, payroll)
       QuickBooks:  Full access (clients, vendors, invoices, bills, reports)
       Fieldglass:  Full access (all timesheets, approvals)
       Settings:    Subscription, company, roles, invitations

     MANAGER:
       ADP:        Workers, candidates (own company)
       QuickBooks:  View-only (no create/edit invoices or bills)
       Fieldglass:  Approve timesheets, view all
       Settings:    None

     VENDOR:
       ADP:        Job postings, hiring/firing, candidate review
       QuickBooks:  None
       Fieldglass:  Approve timesheets for candidates on their job postings
       Settings:    None

     MARKETER (ACCOUNTS):
       ADP:        Candidates list, payroll processing
       QuickBooks:  Full access (this IS the finance team)
       Fieldglass:  View timesheets (for payroll/invoice generation)
       Settings:    None

     MARKETER (IMMIGRATION):
       ADP:        Candidates list
       QuickBooks:  None
       Fieldglass:  View timesheets
       Settings:    None
       Extra:       Immigration module

     MARKETER (PLACEMENT):
       ADP:        None
       QuickBooks:  None
       Fieldglass:  View timesheets
       Settings:    None
       Extra:       Staffing & placement modules
```

### Permission Matrix (All Three Pillars)

```
┌──────────────────────────────┬───────┬─────────┬────────┬──────────┬─────────────┬────────────┐
│ Feature                      │ Admin │ Manager │ Vendor │ Mkt-Acct │ Mkt-Immig   │ Mkt-Place  │
├──────────────────────────────┼───────┼─────────┼────────┼──────────┼─────────────┼────────────┤
│ ADP — Worker Profiles        │  ✅   │   ✅    │   ❌   │    ❌    │     ❌      │     ❌     │
│ ADP — Candidate Profiles     │  ✅   │   ✅    │   ✅*  │    ✅    │     ✅      │     ❌     │
│ ADP — Onboarding             │  ✅   │   ✅    │   ❌   │    ❌    │     ❌      │     ❌     │
│ ADP — Payroll Processing     │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ ADP — Pay Stubs              │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ ADP — Job Postings           │  ✅   │   ✅    │   ✅   │    ❌    │     ❌      │     ❌     │
│ ADP — Hiring / Firing        │  ✅   │   ✅    │   ✅   │    ❌    │     ❌      │     ❌     │
│ QB — Client Management       │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ QB — Create/Send Invoices    │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ QB — Vendor Management       │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ QB — Enter/Pay Bills         │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ QB — Financial Reports       │  ✅   │   👁️    │   ❌   │    ✅    │     ❌      │     ❌     │
│ QB — Cash Flow Dashboard     │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ QB — Margin Tracking         │  ✅   │   ❌    │   ❌   │    ✅    │     ❌      │     ❌     │
│ FG — Submit Own Timesheet    │  ❌   │   ❌    │   ❌   │    ❌    │     ❌      │     ❌     │
│ FG — Approve Timesheets      │  ✅   │   ✅    │   ✅*  │    ❌    │     ❌      │     ❌     │
│ FG — View All Timesheets     │  ✅   │   ✅    │   ❌   │    ✅    │     ✅      │     ✅     │
│ FG — PTO / Leave Management  │  ✅   │   ✅    │   ❌   │    ❌    │     ❌      │     ❌     │
│ Immigration Module           │  ✅   │   ❌    │   ❌   │    ❌    │     ✅      │     ❌     │
│ Projects                     │  ✅   │   ✅    │   ❌   │    ✅    │     ✅      │     ❌     │
│ Staffing Operations          │  ✅   │   ✅    │   ❌   │    ✅    │     ✅      │     ✅     │
│ Placement                    │  ✅   │   ✅    │   ❌   │    ❌    │     ❌      │     ✅     │
│ Invite Workers               │  ✅   │   ❌    │   ❌   │    ❌    │     ❌      │     ❌     │
│ Manage Roles                 │  ✅   │   ❌    │   ❌   │    ❌    │     ❌      │     ❌     │
│ Subscription / Billing       │  ✅   │   ❌    │   ❌   │    ❌    │     ❌      │     ❌     │
│ Company Settings             │  ✅   │   ❌    │   ❌   │    ❌    │     ❌      │     ❌     │
├──────────────────────────────┴───────┴─────────┴────────┴──────────┴─────────────┴────────────┤
│ ✅* Vendor: only candidates on THEIR job postings, not all candidates                         │
│ 👁️  Manager: view-only financial reports, cannot create invoices/bills                        │
│ Candidates submit timesheets from the CANDIDATE login, not employer                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SIDEBAR NAVIGATION

```
CANDIDATE LOGIN:
├── Dashboard (my applications, upcoming shifts)
├── Browse Jobs
├── My Applications
├── My Timesheets          ← FIELDGLASS (submit hours)
├── My Pay Stubs           ← ADP (view pay history)
├── My Documents
└── My Profile

EMPLOYER LOGIN — ADMIN:
├── Dashboard
├── ── ADP (People) ──────
├── Job Postings
├── Candidates
├── Workers
├── Onboarding
├── Payroll                ← ADP (process payroll)
├── ── QuickBooks (Money) ─
├── Clients
├── Invoices               ← QB (bill clients)
├── Vendors
├── Bills                  ← QB (pay vendors)
├── Financial Reports
├── ── Fieldglass (Time) ──
├── Timesheets             ← FG (approve, view all)
├── PTO / Leave
├── ── Other ──────────────
├── Immigration
├── Projects
├── Staffing Operations
├── Placement
├── ── Settings ───────────
├── Team Management
├── Subscription & Billing
└── Company Settings

EMPLOYER LOGIN — MANAGER:
├── Dashboard
├── Job Postings
├── Candidates
├── Workers
├── Timesheets             ← FG (approve)
├── PTO / Leave
├── Projects
├── Staffing Operations
└── Placement

EMPLOYER LOGIN — VENDOR:
├── Dashboard
├── Job Postings
├── Timesheet Approvals    ← FG (approve for their candidates)
└── (nothing else)

EMPLOYER LOGIN — MARKETER (ACCOUNTS):
├── Dashboard
├── Candidates
├── Payroll                ← ADP
├── Clients                ← QB
├── Invoices               ← QB
├── Vendors                ← QB
├── Bills                  ← QB
├── Financial Reports      ← QB
├── Timesheets (view)      ← FG
├── Projects
└── Staffing Operations

EMPLOYER LOGIN — MARKETER (IMMIGRATION):
├── Dashboard
├── Candidates
├── Immigration
├── Timesheets (view)      ← FG
├── Projects
└── Staffing Operations

EMPLOYER LOGIN — MARKETER (PLACEMENT):
├── Dashboard
├── Timesheets (view)      ← FG
├── Staffing Operations
└── Placement
```

---

## THE DATA FLOW — HOW THE THREE PILLARS CONNECT

```
┌─────────────────────────────────────────────────────────────────────┐
│                    END-TO-END DATA FLOW                              │
│                                                                     │
│  1. ADMIN hires candidate (ADP)                                     │
│     → Candidate placed at client site                               │
│     → Pay rate set: $42/hr                                          │
│     → Bill rate set: $85/hr (QuickBooks rate card)                  │
│                                                                     │
│  2. CANDIDATE submits weekly timesheet (FIELDGLASS)                 │
│     → 40 regular hours + 2.5 overtime                               │
│     → Submitted → Approved by Manager/Vendor                        │
│                                                                     │
│  3. FINANCE TEAM runs payroll (ADP)                                 │
│     → Pulls approved hours from Fieldglass                          │
│     → Calculates: 40×$42 + 2.5×$63 = $1,837.50 gross               │
│     → Deducts taxes (if W-2) or pays flat (if 1099)                │
│     → Generates pay stub                                            │
│     → Candidate sees pay stub in Candidate portal                   │
│                                                                     │
│  4. FINANCE TEAM creates client invoice (QUICKBOOKS)                │
│     → Pulls same approved hours from Fieldglass                     │
│     → Calculates: 40×$85 + 2.5×$127.50 = $3,718.75                 │
│     → Sends invoice to Acme Corp                                    │
│     → Tracks payment status                                         │
│                                                                     │
│  5. MARGIN CAPTURED (QUICKBOOKS)                                    │
│     → Client paid:     $3,718.75                                    │
│     → Candidate paid:  $1,837.50                                    │
│     → Gross margin:    $1,881.25 (50.6%)                            │
│                                                                     │
│  6. VENDOR BILLS (QUICKBOOKS)                                       │
│     → AWS bill: $2,400    → Entered → Approved → Paid              │
│     → Rent:    $5,000     → Entered → Approved → Paid              │
│     → These are separate from payroll                               │
│                                                                     │
│  7. REPORTS (ALL THREE)                                             │
│     → P&L: Revenue (QB) - Payroll (ADP) - Expenses (QB) = Profit  │
│     → Utilization: Hours billed (FG) / Hours available             │
│     → Margin per candidate: Bill rate - Pay rate per person         │
│     → AR Aging: Outstanding client invoices                         │
│     → AP Aging: Outstanding vendor bills                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API ROUTES BY PILLAR

```
AUTH (2 logins only):
  POST   /api/auth/candidate/register
  POST   /api/auth/candidate/login
  POST   /api/auth/employer/register        → Creates company + admin account
  POST   /api/auth/employer/login           → All roles use this
  POST   /api/auth/invite/send              → [ADMIN only]
  POST   /api/auth/invite/accept

═══ ADP ROUTES (People) ═══

WORKERS:
  GET    /api/workers                       → [ADMIN, MANAGER]
  GET    /api/workers/:id
  PUT    /api/workers/:id
  PUT    /api/workers/:id/role              → [ADMIN]
  PUT    /api/workers/:id/lifecycle         → [ADMIN] (status transitions)

CANDIDATES:
  GET    /api/candidates                    → [ADMIN, MANAGER, VENDOR*, ACCTS, IMMIG]
  GET    /api/candidates/:id
  PUT    /api/candidates/:id
  PUT    /api/candidates/:id/placement      → [ADMIN, MANAGER, VENDOR]

JOBS:
  GET    /api/jobs                          → Public (candidates browse)
  POST   /api/jobs                          → [ADMIN, MANAGER, VENDOR]
  PUT    /api/jobs/:id
  DELETE /api/jobs/:id

PAYROLL:
  GET    /api/payroll/periods               → [ADMIN, ACCTS]
  POST   /api/payroll/periods               → Create pay period
  GET    /api/payroll/periods/:id
  PUT    /api/payroll/periods/:id           → Edit draft
  POST   /api/payroll/periods/:id/submit    → Submit for approval
  POST   /api/payroll/periods/:id/approve   → [ADMIN only]
  POST   /api/payroll/periods/:id/process   → Process payroll
  POST   /api/payroll/periods/:id/void
  GET    /api/payroll/stubs/:personId       → Person's pay stubs

ONBOARDING:
  GET    /api/onboarding/:personId          → [ADMIN, MANAGER]
  PUT    /api/onboarding/:personId/checklist

═══ QUICKBOOKS ROUTES (Money) ═══

CLIENTS:
  GET    /api/clients                       → [ADMIN, ACCTS]
  POST   /api/clients
  PUT    /api/clients/:id
  GET    /api/clients/:id/rate-cards

INVOICES:
  GET    /api/invoices                      → [ADMIN, ACCTS]
  POST   /api/invoices                      → [ADMIN, ACCTS]
  PUT    /api/invoices/:id
  POST   /api/invoices/:id/send             → Email to client
  POST   /api/invoices/:id/record-payment
  GET    /api/invoices/aging                 → AR aging report

VENDORS:
  GET    /api/vendors                       → [ADMIN, ACCTS]
  POST   /api/vendors
  PUT    /api/vendors/:id

BILLS:
  GET    /api/bills                         → [ADMIN, ACCTS]
  POST   /api/bills
  PUT    /api/bills/:id
  POST   /api/bills/:id/approve             → [ADMIN]
  POST   /api/bills/:id/pay
  GET    /api/bills/aging                    → AP aging report

FINANCE:
  GET    /api/finance/dashboard              → [ADMIN, ACCTS]
  GET    /api/finance/profit-loss
  GET    /api/finance/cash-flow
  GET    /api/finance/margin-report          → Per-candidate margins
  GET    /api/finance/expense-categories

═══ FIELDGLASS ROUTES (Timesheets) ═══

TIMESHEETS:
  GET    /api/timesheets                    → Scoped by role
  POST   /api/timesheets                    → Worker/Candidate creates
  PUT    /api/timesheets/:id                → Edit draft
  POST   /api/timesheets/:id/submit         → Submit for approval
  POST   /api/timesheets/:id/approve        → [ADMIN, MANAGER, VENDOR*]
  POST   /api/timesheets/:id/reject         → With reason
  GET    /api/timesheets/pending-approval    → [ADMIN, MANAGER, VENDOR]

TIME ENTRIES:
  GET    /api/timesheets/:id/entries         → Daily entries
  PUT    /api/timesheets/:id/entries         → Batch update daily hours

LEAVE:
  GET    /api/leave/balances/:personId       → [ADMIN, MANAGER, self]
  POST   /api/leave/request                  → Worker/Candidate requests PTO
  POST   /api/leave/request/:id/approve      → [ADMIN, MANAGER]
  GET    /api/leave/calendar                 → Team calendar view

═══ OTHER ROUTES ═══

IMMIGRATION:   GET/POST/PUT  /api/immigration/*     → [ADMIN, IMMIG]
PROJECTS:      GET/POST/PUT  /api/projects/*        → [ADMIN, MANAGER, ACCTS, IMMIG]
STAFFING:      GET/POST/PUT  /api/staffing/*        → [ADMIN, MANAGER, ACCTS, IMMIG, PLACE]
PLACEMENT:     GET/POST/PUT  /api/placement/*       → [ADMIN, MANAGER, PLACE]
TEAM:          GET/POST/PUT  /api/team/*            → [ADMIN]
SUBSCRIPTION:  GET/POST/PUT  /api/subscription/*    → [ADMIN]
AUDIT:         GET           /api/audit/*           → [ADMIN]
```

---

## IMPLEMENTATION ORDER

```
STEP 1:  Add new columns to existing tables (employer_users, candidates)
STEP 2:  Create new tables (clients, invoices, vendors, bills, timesheets, time_entries,
         payroll_records, pay_stubs, rate_cards, leave_balances, audit_logs)
STEP 3:  Build 2-login auth (Candidate + Employer with role detection)
STEP 4:  Build RBAC middleware (check role + pillar permissions on every route)
STEP 5:  Build FIELDGLASS — Timesheet submit/approve/reject flow
         (this is the foundation — both ADP and QB depend on it)
STEP 6:  Build ADP — Worker lifecycle + candidate placement
STEP 7:  Build ADP — Payroll module (4-step wizard pulling from Fieldglass hours)
STEP 8:  Build QUICKBOOKS — Client management + rate cards
STEP 9:  Build QUICKBOOKS — Invoice generation (pulling from Fieldglass hours)
STEP 10: Build QUICKBOOKS — Vendor management + bill entry/approval/payment
STEP 11: Build QUICKBOOKS — Financial dashboard (AR/AP aging, cash flow, margins)
STEP 12: Build FIELDGLASS — PTO/leave management
STEP 13: Build dynamic sidebar per role
STEP 14: Build pay stub generation (PDF) viewable by both Candidate and Employer
STEP 15: Build audit logging across all three pillars
STEP 16: Wire existing pages (immigration, projects, staffing, placement) to new RBAC
STEP 17: Delete old marketer/vendor login systems
STEP 18: Update seed data with all role/pillar combinations
STEP 19: End-to-end testing: complete flow from timesheet → payroll + invoice
STEP 20: Update README
```

---

## CRITICAL RULES

```
1.  FIELDGLASS IS THE SOURCE OF TRUTH FOR HOURS
    Payroll (ADP) and Invoices (QB) MUST pull hours from approved timesheets.
    No manual hour entry in payroll or invoices — always linked to a timesheet.

2.  ONLY TWO LOGINS — Candidate and Employer. No separate admin login.
    Admin is just a role inside the Employer login.

3.  QUICKBOOKS IS NOT PAYROLL — QuickBooks handles client invoicing and vendor
    bills (company money). ADP handles paying people (payroll).

4.  MARGIN TRACKING IS AUTOMATIC — When a timesheet is approved, the system
    knows the pay rate (ADP) and bill rate (QB rate card). Margin = bill - pay.

5.  PAYROLL APPROVAL CHAIN — Finance team (Marketer-Accounts) creates payroll,
    Admin approves. Admin can self-approve but it's logged.

6.  INVOICE APPROVAL CHAIN — Finance team creates invoice from approved timesheets,
    Admin approves before sending to client.

7.  VENDOR BILL APPROVAL — Finance team enters bill, Admin approves before payment.

8.  TIMESHEET APPROVAL — Manager or Vendor approves timesheets for workers/candidates
    under their supervision. Admin can approve anyone's timesheet.

9.  EVERY FINANCIAL ACTION IS AUDITED — Payroll, invoices, bills, payments.
    User ID, role, timestamp, IP address, before/after values.

10. SOFT DELETE EVERYTHING — Never hard-delete financial or timesheet records.
    Use status flags: VOIDED, CANCELLED, ARCHIVED.

11. CANDIDATES SEE THEIR OWN DATA — From Candidate login: their timesheets,
    their pay stubs, their applications. Nothing else.

12. NO DATA LEAKS BETWEEN COMPANIES — Employer roles ONLY see their own
    company's workers, candidates, clients, vendors, and timesheets.
```

On top this , Our primary goal of this app

candidates are allowed to look at the job openigns in market

employer can post job openings(vendor login inside a employer company ) they can post job openings in c2c , w2,1099 etc all types in usa .

the matched candidates should show to the vendor with match meter and matched job openings should show to the candidates with a match meter

match based on the skills, requirement,profile, location , (like create a node for a candidate) and matchthe node with the job opening

candiadte can poke or mail the vendor

vendor can poke or mail the candidate
