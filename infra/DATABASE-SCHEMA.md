# MatchDB � Database Schema Reference (MongoDB Atlas)

MERN-stack platform powered by MongoDB Atlas.
Each backend service connects to its own database within the same Atlas cluster.

- **Engine:** MongoDB Atlas (cloud-hosted)
- **ODM:** Mongoose 8
- **Cluster:** `matchingdb.mrumkpb.mongodb.net`
- **Databases:**
  - `matchdb-shell` � Auth, Users, Subscriptions, Payments (shell-services)
  - `matchdb-jobs` — Jobs, Profiles, Applications, Companies, RBAC (jobs-services)
  - `matchdb_data_collection` � Scraped job data (data-collection-mono)
- **ID strategy:** `_id: String` � generated via `new ObjectId().toString()`
- **No Prisma, no PostgreSQL** � pure Mongoose schemas

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Auth Domain � matchdb-shell (shell-services)](#auth-domain--matchdb-shell-shell-services)
   - [User](#user)
   - [Subscription](#subscription)
   - [RefreshToken](#refreshtoken)
   - [CandidatePayment](#candidatepayment)
3. [Jobs Domain � matchdb-jobs (jobs-services)](#jobs-domain--matchdb-jobs-jobs-services)
   - [Job](#job)
   - [CandidateProfile](#candidateprofile)
   - [Application](#application)
   - [PokeRecord](#pokerecord)
   - [PokeLog](#pokelog)
   - [InterviewInvite](#interviewinvite)
4. [Employer Domain — matchdb-jobs (jobs-services)](#employer-domain--matchdb-jobs-jobs-services)
   - [Company](#company)
   - [EmployerCandidate](#employercandidate)
   - [ForwardedOpening](#forwardedopening)
   - [CompanyInvite](#companyinvite)
   - [CompanyAdmin](#companyadmin)
   - [CompanyUser](#companyuser)
   - [EmployeeInvitation](#employeeinvitation)
   - [ClientCompany](#clientcompany)
   - [VendorCompany](#vendorcompany)
   - [SubscriptionPlan](#subscriptionplan)
   - [Counter](#counter)
5. [Financials Domain � matchdb-jobs (jobs-services)](#financials-domain--matchdb-jobs-jobs-services)
   - [ProjectFinancial](#projectfinancial)
   - [Timesheet](#timesheet)
6. [Indexes](#indexes)
7. [Relationships (manual � no populate)](#relationships-manual--no-populate)
8. [Enum-like String Values](#enum-like-string-values)
9. [Connection Strings](#connection-strings)

---

## Architecture Overview

```
+----------------------------------------------------------+
�                   MongoDB Atlas Cluster                   �
�              matchingdb.mrumkpb.mongodb.net                �
+----------------------------------------------------------�
� matchdb-shell  �  matchdb-jobs   � matchdb_data_collect  �
│  (4 models)    │  (20 models)    │  (Mongoose models)    │
+----------------------------------------------------------+
        �                 �                    �
  shell-services:8000  jobs-services:8001  data-collection:5001
```

All models use `_id: String` instead of ObjectId.
No `populate()` � relationships resolved via separate queries + Map lookups.
All queries use `.lean()` for plain JS objects.

---

## Auth Domain � matchdb-shell (shell-services)

### User

**Collection:** `users`

| Field                  | Type    | Required | Default               | Unique       | Notes                     |
| ---------------------- | ------- | -------- | --------------------- | ------------ | ------------------------- |
| \_id                   | String  | auto     | ObjectId().toString() | PK           |                           |
| email                  | String  | yes      | �                     | yes          |                           |
| password               | String  | no       | null                  |              | bcrypt hash               |
| googleId               | String  | no       | null                  | yes (sparse) | OAuth                     |
| username               | String  | no       | null                  | yes (sparse) |                           |
| firstName              | String  | no       | null                  |              |                           |
| lastName               | String  | no       | null                  |              |                           |
| userType               | String  | no       | `"candidate"`         |              | candidate/vendor/marketer |
| membershipConfig       | String  | no       | null                  |              | JSON string               |
| hasPurchasedVisibility | Boolean | no       | false                 |              |                           |
| isActive               | Boolean | no       | true                  |              |                           |
| createdAt              | Date    | auto     | �                     |              | timestamps                |
| updatedAt              | Date    | auto     | �                     |              | timestamps                |

### Subscription

**Collection:** `subscriptions`

| Field            | Type   | Required | Default               | Unique       | Notes                    |
| ---------------- | ------ | -------- | --------------------- | ------------ | ------------------------ |
| \_id             | String | auto     | ObjectId().toString() | PK           |                          |
| userId           | String | yes      | �                     | yes          |                          |
| stripeCustomerId | String | no       | null                  | yes (sparse) |                          |
| stripePriceId    | String | no       | null                  |              |                          |
| stripeSubId      | String | no       | null                  |              |                          |
| plan             | String | no       | `"free"`              |              | free/pro/enterprise      |
| status           | String | no       | `"inactive"`          |              | active/inactive/canceled |
| currentPeriodEnd | Date   | no       | null                  |              |                          |
| createdAt        | Date   | auto     | �                     |              | timestamps               |
| updatedAt        | Date   | auto     | �                     |              | timestamps               |

### RefreshToken

**Collection:** `refreshtokens`

| Field     | Type    | Required | Default               | Unique | Notes                    |
| --------- | ------- | -------- | --------------------- | ------ | ------------------------ |
| \_id      | String  | auto     | ObjectId().toString() | PK     |                          |
| token     | String  | yes      | �                     | yes    | JWT refresh token        |
| userId    | String  | yes      | �                     |        | indexed                  |
| expiresAt | Date    | yes      | �                     |        | TTL candidate            |
| revoked   | Boolean | no       | false                 |        |                          |
| createdAt | Date    | auto     | �                     |        | timestamp (no updatedAt) |

### CandidatePayment

**Collection:** `candidatepayments`

| Field                 | Type   | Required | Default               | Unique | Notes                        |
| --------------------- | ------ | -------- | --------------------- | ------ | ---------------------------- |
| \_id                  | String | auto     | ObjectId().toString() | PK     |                              |
| userId                | String | yes      | �                     |        | indexed                      |
| stripeSessionId       | String | yes      | �                     | yes    |                              |
| stripePaymentIntentId | String | no       | null                  |        |                              |
| packageType           | String | yes      | �                     |        | base/subdomain/single/bundle |
| domain                | String | no       | null                  |        |                              |
| subdomains            | String | yes      | �                     |        | comma-separated              |
| amountCents           | Number | yes      | �                     |        |                              |
| status                | String | no       | `"pending"`           |        | pending/completed/failed     |
| createdAt             | Date   | auto     | �                     |        | timestamps                   |
| updatedAt             | Date   | auto     | �                     |        | timestamps                   |

---

## Jobs Domain � matchdb-jobs (jobs-services)

### Job

**Collection:** `jobs`

| Field              | Type     | Required | Default               | Unique | Notes                      |
| ------------------ | -------- | -------- | --------------------- | ------ | -------------------------- |
| \_id               | String   | auto     | ObjectId().toString() | PK     |                            |
| vendorId           | String   | yes      | �                     |        |                            |
| vendorEmail        | String   | yes      | �                     |        |                            |
| recruiterName      | String   | no       | `""`                  |        |                            |
| recruiterPhone     | String   | no       | `""`                  |        |                            |
| title              | String   | yes      | �                     |        |                            |
| description        | String   | no       | `""`                  |        |                            |
| location           | String   | no       | `""`                  |        |                            |
| jobCountry         | String   | no       | `""`                  |        |                            |
| jobState           | String   | no       | `""`                  |        |                            |
| jobCity            | String   | no       | `""`                  |        |                            |
| jobType            | String   | yes      | �                     |        | contract/fulltime/parttime |
| jobSubType         | String   | no       | `""`                  |        | c2c/w2/1099                |
| workMode           | String   | no       | `""`                  |        | remote/hybrid/onsite       |
| salaryMin          | Number   | no       | null                  |        |                            |
| salaryMax          | Number   | no       | null                  |        |                            |
| payPerHour         | Number   | no       | null                  |        |                            |
| skillsRequired     | [String] | no       | []                    |        |                            |
| experienceRequired | Number   | no       | 0                     |        | years                      |
| applicationCount   | Number   | no       | 0                     |        | denormalized counter       |
| isActive           | Boolean  | no       | true                  |        |                            |
| sourceUserId       | String   | no       | `""`                  |        | data-collection origin     |
| sourceCompanyId    | String   | no       | `""`                  |        |                            |
| createdAt          | Date     | auto     | �                     |        | timestamps                 |
| updatedAt          | Date     | auto     | �                     |        | timestamps                 |

**Indexes:** `{ vendorId: 1, createdAt: -1 }`, `{ isActive: 1, createdAt: -1 }`, `{ sourceUserId: 1 }`

### CandidateProfile

**Collection:** `candidateprofiles`

| Field              | Type     | Required | Default               | Unique | Notes                         |
| ------------------ | -------- | -------- | --------------------- | ------ | ----------------------------- |
| \_id               | String   | auto     | ObjectId().toString() | PK     |                               |
| candidateId        | String   | yes      | �                     | yes    | matches User.\_id             |
| username           | String   | no       | `""`                  |        |                               |
| name               | String   | no       | `""`                  |        |                               |
| email              | String   | no       | `""`                  |        |                               |
| phone              | String   | no       | `""`                  |        |                               |
| currentCompany     | String   | no       | `""`                  |        |                               |
| currentRole        | String   | no       | `""`                  |        |                               |
| preferredJobType   | String   | no       | `""`                  |        |                               |
| expectedHourlyRate | Number   | no       | null                  |        |                               |
| experienceYears    | Number   | no       | 0                     |        |                               |
| skills             | [String] | no       | []                    |        |                               |
| location           | String   | no       | `""`                  |        |                               |
| profileCountry     | String   | no       | `""`                  |        |                               |
| bio                | String   | no       | `""`                  |        |                               |
| resumeSummary      | String   | no       | `""`                  |        |                               |
| resumeExperience   | String   | no       | `""`                  |        |                               |
| resumeEducation    | String   | no       | `""`                  |        |                               |
| resumeAchievements | String   | no       | `""`                  |        |                               |
| visibilityConfig   | Mixed    | no       | null                  |        | `{ domain: [subdomain,...] }` |
| companyId          | String   | no       | `""`                  |        | employer company              |
| companyName        | String   | no       | `""`                  |        |                               |
| profileLocked      | Boolean  | no       | false                 |        |                               |
| createdAt          | Date     | auto     | �                     |        | timestamps                    |
| updatedAt          | Date     | auto     | �                     |        | timestamps                    |

**Indexes:** `{ createdAt: -1 }`, `{ companyId: 1 }`

### Application

**Collection:** `applications`

| Field          | Type   | Required | Default               | Unique | Notes                              |
| -------------- | ------ | -------- | --------------------- | ------ | ---------------------------------- |
| \_id           | String | auto     | ObjectId().toString() | PK     |                                    |
| jobId          | String | yes      | �                     |        |                                    |
| jobTitle       | String | no       | `""`                  |        | denormalized                       |
| candidateId    | String | yes      | �                     |        |                                    |
| candidateEmail | String | yes      | �                     |        |                                    |
| coverLetter    | String | no       | `""`                  |        |                                    |
| status         | String | no       | `"pending"`           |        | pending/shortlisted/rejected/hired |
| createdAt      | Date   | auto     | �                     |        | timestamps                         |
| updatedAt      | Date   | auto     | �                     |        | timestamps                         |

**Indexes:** `{ jobId: 1, candidateId: 1 }` (unique), `{ candidateId: 1 }`

### PokeRecord

**Collection:** `pokerecords`

| Field          | Type    | Required | Default               | Unique | Notes            |
| -------------- | ------- | -------- | --------------------- | ------ | ---------------- |
| \_id           | String  | auto     | ObjectId().toString() | PK     |                  |
| senderId       | String  | yes      | �                     |        |                  |
| senderName     | String  | no       | `""`                  |        |                  |
| senderEmail    | String  | no       | `""`                  |        |                  |
| senderType     | String  | yes      | �                     |        | candidate/vendor |
| targetId       | String  | yes      | �                     |        |                  |
| targetVendorId | String  | no       | null                  |        |                  |
| targetEmail    | String  | yes      | �                     |        |                  |
| targetName     | String  | no       | `""`                  |        |                  |
| subject        | String  | no       | `""`                  |        |                  |
| isEmail        | Boolean | no       | false                 |        |                  |
| jobId          | String  | no       | null                  |        |                  |
| jobTitle       | String  | no       | null                  |        |                  |
| createdAt      | Date    | auto     | �                     |        | timestamps       |
| updatedAt      | Date    | auto     | �                     |        | timestamps       |

**Indexes:** `{ senderId: 1, targetId: 1, isEmail: 1 }` (unique), `{ senderId: 1 }`, `{ targetId: 1 }`

### PokeLog

**Collection:** `pokelogs`

| Field     | Type   | Required | Default               | Unique | Notes              |
| --------- | ------ | -------- | --------------------- | ------ | ------------------ |
| \_id      | String | auto     | ObjectId().toString() | PK     |                    |
| userId    | String | yes      | �                     |        |                    |
| yearMonth | String | yes      | �                     |        | `"2025-01"` format |
| count     | Number | no       | 0                     |        | monthly poke count |
| createdAt | Date   | auto     | �                     |        | timestamps         |
| updatedAt | Date   | auto     | �                     |        | timestamps         |

**Indexes:** `{ userId: 1, yearMonth: 1 }` (unique)

### InterviewInvite

**Collection:** `interviewinvites`

| Field          | Type   | Required | Default               | Unique | Notes                     |
| -------------- | ------ | -------- | --------------------- | ------ | ------------------------- |
| \_id           | String | auto     | ObjectId().toString() | PK     |                           |
| vendorId       | String | yes      | �                     |        |                           |
| vendorEmail    | String | no       | `""`                  |        |                           |
| vendorName     | String | no       | `""`                  |        |                           |
| candidateEmail | String | yes      | �                     |        |                           |
| candidateName  | String | no       | `""`                  |        |                           |
| jobId          | String | no       | `""`                  |        |                           |
| jobTitle       | String | no       | `""`                  |        |                           |
| interviewDate  | Date   | no       | null                  |        |                           |
| interviewTime  | String | no       | `""`                  |        | eg `"10:00 AM"`           |
| interviewType  | String | no       | `""`                  |        | video/phone/onsite        |
| interviewLink  | String | no       | `""`                  |        | Zoom/Meet URL             |
| notes          | String | no       | `""`                  |        |                           |
| status         | String | no       | `"pending"`           |        | pending/accepted/declined |
| createdAt      | Date   | auto     | �                     |        | timestamps                |
| updatedAt      | Date   | auto     | �                     |        | timestamps                |

**Indexes:** `{ vendorId: 1, createdAt: -1 }`, `{ candidateEmail: 1, createdAt: -1 }`

---

## Marketer Domain � matchdb-jobs (jobs-services)

### Company

**Collection:** `companies`

| Field         | Type   | Required | Default               | Unique | Notes                    |
| ------------- | ------ | -------- | --------------------- | ------ | ------------------------ |
| \_id          | String | auto     | ObjectId().toString() | PK     |                          |
| name          | String | yes      | �                     |        | indexed                  |
| marketerId    | String | yes      | �                     | yes    | one company per marketer |
| marketerEmail | String | yes      | �                     |        |                          |
| createdAt     | Date   | auto     | �                     |        | timestamps               |
| updatedAt     | Date   | auto     | �                     |        | timestamps               |

**Indexes:** `{ name: 1 }`

### MarketerCandidate

**Collection:** `marketercandidates`

| Field          | Type   | Required | Default               | Unique       | Notes                |
| -------------- | ------ | -------- | --------------------- | ------------ | -------------------- |
| \_id           | String | auto     | ObjectId().toString() | PK           |                      |
| companyId      | String | yes      | �                     |              |                      |
| marketerId     | String | yes      | �                     |              |                      |
| candidateId    | String | no       | `""`                  |              | set when user exists |
| candidateName  | String | no       | `""`                  |              |                      |
| candidateEmail | String | yes      | �                     |              |                      |
| inviteStatus   | String | no       | `"none"`              |              | none/sent/accepted   |
| inviteToken    | String | no       | null                  | yes (sparse) |                      |
| inviteSentAt   | Date   | no       | null                  |              |                      |
| createdAt      | Date   | auto     | �                     |              | timestamps           |
| updatedAt      | Date   | auto     | �                     |              | timestamps           |

**Indexes:** `{ companyId: 1, candidateEmail: 1 }` (unique), `{ marketerId: 1 }`

### ForwardedOpening

**Collection:** `forwardedopenings`

| Field          | Type     | Required | Default               | Unique | Notes                     |
| -------------- | -------- | -------- | --------------------- | ------ | ------------------------- |
| \_id           | String   | auto     | ObjectId().toString() | PK     |                           |
| marketerId     | String   | yes      | �                     |        |                           |
| marketerEmail  | String   | no       | `""`                  |        |                           |
| companyId      | String   | yes      | �                     |        |                           |
| companyName    | String   | no       | `""`                  |        |                           |
| candidateEmail | String   | yes      | �                     |        |                           |
| candidateName  | String   | no       | `""`                  |        |                           |
| jobId          | String   | yes      | �                     |        |                           |
| jobTitle       | String   | no       | `""`                  |        |                           |
| jobLocation    | String   | no       | `""`                  |        |                           |
| jobType        | String   | no       | `""`                  |        |                           |
| jobSubType     | String   | no       | `""`                  |        |                           |
| vendorEmail    | String   | no       | `""`                  |        |                           |
| skillsRequired | [String] | no       | []                    |        |                           |
| payPerHour     | Number   | no       | null                  |        |                           |
| salaryMin      | Number   | no       | null                  |        |                           |
| salaryMax      | Number   | no       | null                  |        |                           |
| note           | String   | no       | `""`                  |        |                           |
| status         | String   | no       | `"pending"`           |        | pending/applied/dismissed |
| createdAt      | Date     | auto     | �                     |        | timestamps                |
| updatedAt      | Date     | auto     | �                     |        | timestamps                |

**Indexes:** `{ marketerId: 1, candidateEmail: 1, jobId: 1 }` (unique), `{ candidateEmail: 1, createdAt: -1 }`

### CompanyInvite

**Collection:** `companyinvites`

| Field          | Type   | Required | Default               | Unique | Notes                     |
| -------------- | ------ | -------- | --------------------- | ------ | ------------------------- |
| \_id           | String | auto     | ObjectId().toString() | PK     |                           |
| companyId      | String | yes      | �                     |        |                           |
| companyName    | String | no       | `""`                  |        |                           |
| marketerId     | String | yes      | �                     |        |                           |
| marketerEmail  | String | no       | `""`                  |        |                           |
| candidateEmail | String | yes      | �                     |        |                           |
| candidateName  | String | no       | `""`                  |        |                           |
| offerNote      | String | no       | `""`                  |        |                           |
| token          | String | auto     | crypto.randomUUID()   | yes    | invite link token         |
| status         | String | no       | `"pending"`           |        | pending/accepted/declined |
| expiresAt      | Date   | no       | null                  |        |                           |
| createdAt      | Date   | auto     | �                     |        | timestamps                |
| updatedAt      | Date   | auto     | �                     |        | timestamps                |

**Indexes:** `{ companyId: 1, candidateEmail: 1 }` (unique)

### CompanyAdmin

**Collection:** `companyadmins`

| Field              | Type   | Required | Default               | Unique | Notes                      |
| ------------------ | ------ | -------- | --------------------- | ------ | -------------------------- |
| \_id               | String | auto     | ObjectId().toString() | PK     |                            |
| companyId          | String | yes      | —                     | yes    |                            |
| companyName        | String | yes      | —                     |        |                            |
| adminUserId        | String | yes      | —                     | yes    |                            |
| adminEmail         | String | yes      | —                     |        | indexed                    |
| adminName          | String | no       | `""`                  |        |                            |
| subscriptionPlanId | String | no       | null                  |        | refs SubscriptionPlan.\_id |
| seatLimit          | Number | no       | 3                     |        | starter default            |
| seatsUsed          | Number | no       | 0                     |        |                            |
| createdAt          | Date   | auto     | —                     |        | timestamps                 |
| updatedAt          | Date   | auto     | —                     |        | timestamps                 |

**Indexes:** `{ adminEmail: 1 }`

### CompanyUser

**Collection:** `companyusers`

| Field        | Type     | Required | Default               | Unique       | Notes                          |
| ------------ | -------- | -------- | --------------------- | ------------ | ------------------------------ |
| \_id         | String   | auto     | ObjectId().toString() | PK           |                                |
| companyId    | String   | yes      | —                     |              |                                |
| userId       | String   | yes      | —                     |              | references shell User.\_id     |
| workerId     | String   | no       | `""`                  | yes (sparse) | human-readable e.g. "WKR-0001" |
| email        | String   | yes      | —                     |              |                                |
| fullName     | String   | no       | `""`                  |              |                                |
| phone        | String   | no       | `""`                  |              |                                |
| designation  | String   | no       | `""`                  |              |                                |
| role         | String   | no       | `"vendor"`            |              | admin/manager/vendor/marketer  |
| department   | String   | no       | null                  |              | accounts/immigration/placement |
| permissions  | [String] | no       | []                    |              |                                |
| status       | String   | no       | `"active"`            |              | active/invited/deactivated     |
| invitationId | String   | no       | null                  |              |                                |
| invitedBy    | String   | no       | null                  |              | userId of inviting admin       |
| lastLoginAt  | Date     | no       | null                  |              |                                |
| lastActiveAt | Date     | no       | null                  |              |                                |
| onlineStatus | String   | no       | `"offline"`           |              | online/away/offline            |
| joinedAt     | Date     | no       | auto                  |              |                                |
| createdAt    | Date     | auto     | —                     |              | timestamps                     |
| updatedAt    | Date     | auto     | —                     |              | timestamps                     |

**Indexes:** `{ companyId: 1, userId: 1 }` (unique), `{ companyId: 1, email: 1 }` (unique), `{ companyId: 1, role: 1 }`, `{ companyId: 1, status: 1 }`

### EmployeeInvitation

**Collection:** `employeeinvitations`

| Field              | Type   | Required | Default               | Unique | Notes                            |
| ------------------ | ------ | -------- | --------------------- | ------ | -------------------------------- |
| \_id               | String | auto     | ObjectId().toString() | PK     |                                  |
| companyId          | String | yes      | —                     |        |                                  |
| invitedByAdminId   | String | yes      | —                     |        |                                  |
| inviteeEmail       | String | yes      | —                     |        |                                  |
| inviteeName        | String | no       | `""`                  |        |                                  |
| assignedRole       | String | no       | `"vendor"`            |        | admin/manager/vendor/marketer    |
| assignedDepartment | String | no       | null                  |        | accounts/immigration/placement   |
| token              | String | auto     | crypto.randomUUID()   | yes    | invite link token                |
| status             | String | no       | `"pending"`           |        | pending/accepted/expired/revoked |
| expiresAt          | Date   | auto     | +72 hours             |        |                                  |
| usedAt             | Date   | no       | null                  |        |                                  |
| createdAt          | Date   | auto     | —                     |        | timestamps                       |
| updatedAt          | Date   | auto     | —                     |        | timestamps                       |

**Indexes:** `{ companyId: 1, inviteeEmail: 1 }`, `{ expiresAt: 1 }`

### ClientCompany

**Collection:** `clientcompanies`

| Field      | Type   | Required | Default               | Unique | Notes |
| ---------- | ------ | -------- | --------------------- | ------ | ----- |
| \_id       | String | auto     | ObjectId().toString() | PK     |       |
| name       | String | yes      | —                     |        |       |
| employerId | String | yes      | —                     |        |       |
| createdAt  | Date   | auto     | —                     |        |       |
| updatedAt  | Date   | auto     | —                     |        |       |

**Indexes:** `{ employerId: 1, name: 1 }` (unique)

### VendorCompany

**Collection:** `vendorcompanies`

| Field      | Type   | Required | Default               | Unique | Notes |
| ---------- | ------ | -------- | --------------------- | ------ | ----- |
| \_id       | String | auto     | ObjectId().toString() | PK     |       |
| name       | String | yes      | —                     |        |       |
| employerId | String | yes      | —                     |        |       |
| createdAt  | Date   | auto     | —                     |        |       |
| updatedAt  | Date   | auto     | —                     |        |       |

**Indexes:** `{ employerId: 1, name: 1 }` (unique)

### SubscriptionPlan

**Collection:** `subscriptionplans`

| Field          | Type    | Required | Default               | Unique | Notes                              |
| -------------- | ------- | -------- | --------------------- | ------ | ---------------------------------- |
| \_id           | String  | auto     | ObjectId().toString() | PK     |                                    |
| name           | String  | yes      | —                     |        |                                    |
| slug           | String  | yes      | —                     | yes    | starter/growth/business/enterprise |
| maxJobPostings | Number  | no       | null                  |        | null = unlimited                   |
| maxCandidates  | Number  | no       | null                  |        |                                    |
| maxWorkers     | Number  | no       | null                  |        |                                    |
| priceMonthly   | Number  | no       | 0                     |        |                                    |
| priceYearly    | Number  | no       | 0                     |        |                                    |
| extraAdminFee  | Number  | no       | 20                    |        | per additional admin/mo            |
| isActive       | Boolean | no       | true                  |        |                                    |
| createdAt      | Date    | auto     | —                     |        | timestamps                         |
| updatedAt      | Date    | auto     | —                     |        | timestamps                         |

### Counter

**Collection:** `counters`

| Field | Type   | Required | Default | Unique | Notes                                    |
| ----- | ------ | -------- | ------- | ------ | ---------------------------------------- |
| \_id  | String | yes      | —       | PK     | sequence name (candidate/worker/company) |
| seq   | Number | no       | 0       |        | current sequence value                   |

Used by `getNextId()` to atomically generate IDs like `CND-0001`, `WKR-0042`, `CMP-0003`.

---

## Financials Domain � matchdb-jobs (jobs-services)

### ProjectFinancial

**Collection:** `projectfinancials`

| Field         | Type   | Required | Default               | Unique | Notes                      |
| ------------- | ------ | -------- | --------------------- | ------ | -------------------------- |
| \_id          | String | auto     | ObjectId().toString() | PK     |                            |
| applicationId | String | yes      | �                     |        |                            |
| marketerId    | String | yes      | �                     |        |                            |
| candidateId   | String | no       | `""`                  |        |                            |
| candidateName | String | no       | `""`                  |        |                            |
| jobTitle      | String | no       | `""`                  |        |                            |
| vendorName    | String | no       | `""`                  |        |                            |
| billRate      | Number | no       | 0                     |        |                            |
| payRate       | Number | no       | 0                     |        |                            |
| hoursWorked   | Number | no       | 0                     |        |                            |
| projectStart  | Date   | no       | null                  |        |                            |
| projectEnd    | Date   | no       | null                  |        |                            |
| stateCode     | String | no       | `""`                  |        | US state code              |
| stateTaxPct   | Number | no       | 0                     |        |                            |
| cashPct       | Number | no       | 0                     |        |                            |
| totalBilled   | Number | no       | 0                     |        | computed                   |
| totalPay      | Number | no       | 0                     |        | computed                   |
| taxAmount     | Number | no       | 0                     |        | computed                   |
| cashAmount    | Number | no       | 0                     |        | computed                   |
| netPayable    | Number | no       | 0                     |        | computed                   |
| amountPaid    | Number | no       | 0                     |        |                            |
| amountPending | Number | no       | 0                     |        | computed                   |
| notes         | String | no       | `""`                  |        |                            |
| status        | String | no       | `"active"`            |        | active/completed/cancelled |
| createdAt     | Date   | auto     | �                     |        | timestamps                 |
| updatedAt     | Date   | auto     | �                     |        | timestamps                 |

**Indexes:** `{ applicationId: 1, marketerId: 1 }` (unique), `{ marketerId: 1, candidateId: 1 }`

### Timesheet

**Collection:** `timesheets`

| Field         | Type   | Required | Default               | Unique | Notes                             |
| ------------- | ------ | -------- | --------------------- | ------ | --------------------------------- |
| \_id          | String | auto     | ObjectId().toString() | PK     |                                   |
| candidateId   | String | yes      | �                     |        |                                   |
| candidateName | String | no       | `""`                  |        |                                   |
| marketerId    | String | yes      | �                     |        |                                   |
| companyId     | String | no       | `""`                  |        |                                   |
| applicationId | String | no       | `""`                  |        |                                   |
| jobTitle      | String | no       | `""`                  |        |                                   |
| weekStart     | Date   | yes      | �                     |        | Monday of week                    |
| entries       | Mixed  | no       | null                  |        | `{ mon: h, tue: h, ... }`         |
| totalHours    | Number | no       | 0                     |        |                                   |
| status        | String | no       | `"draft"`             |        | draft/submitted/approved/rejected |
| submittedAt   | Date   | no       | null                  |        |                                   |
| approvedAt    | Date   | no       | null                  |        |                                   |
| rejectedAt    | Date   | no       | null                  |        |                                   |
| rejectionNote | String | no       | `""`                  |        |                                   |
| createdAt     | Date   | auto     | �                     |        | timestamps                        |
| updatedAt     | Date   | auto     | �                     |        | timestamps                        |

**Indexes:** `{ candidateId: 1, weekStart: 1 }` (unique), `{ marketerId: 1, status: 1 }`, `{ candidateId: 1, weekStart: -1 }`

---

## Indexes

All indexes are defined in the Mongoose schema files (not in migrations).

### Shell Database (matchdb-shell)

| Collection        | Index                     | Unique       |
| ----------------- | ------------------------- | ------------ |
| users             | `{ email: 1 }`            | yes          |
| users             | `{ googleId: 1 }`         | yes (sparse) |
| users             | `{ username: 1 }`         | yes (sparse) |
| subscriptions     | `{ userId: 1 }`           | yes          |
| subscriptions     | `{ stripeCustomerId: 1 }` | yes (sparse) |
| refreshtokens     | `{ token: 1 }`            | yes          |
| refreshtokens     | `{ userId: 1 }`           | no           |
| candidatepayments | `{ stripeSessionId: 1 }`  | yes          |
| candidatepayments | `{ userId: 1 }`           | no           |

### Jobs Database (matchdb-jobs)

| Collection          | Index                                            | Unique       |
| ------------------- | ------------------------------------------------ | ------------ |
| jobs                | `{ vendorId: 1, createdAt: -1 }`                 | no           |
| jobs                | `{ isActive: 1, createdAt: -1 }`                 | no           |
| jobs                | `{ sourceUserId: 1 }`                            | no           |
| candidateprofiles   | `{ candidateId: 1 }`                             | yes          |
| candidateprofiles   | `{ createdAt: -1 }`                              | no           |
| candidateprofiles   | `{ companyId: 1 }`                               | no           |
| applications        | `{ jobId: 1, candidateId: 1 }`                   | yes          |
| applications        | `{ candidateId: 1 }`                             | no           |
| pokerecords         | `{ senderId: 1, targetId: 1, isEmail: 1 }`       | yes          |
| pokerecords         | `{ senderId: 1 }`                                | no           |
| pokerecords         | `{ targetId: 1 }`                                | no           |
| pokelogs            | `{ userId: 1, yearMonth: 1 }`                    | yes          |
| companies           | `{ marketerId: 1 }`                              | yes          |
| companies           | `{ name: 1 }`                                    | no           |
| marketercandidates  | `{ companyId: 1, candidateEmail: 1 }`            | yes          |
| marketercandidates  | `{ employerId: 1 }`                              | no           |
| marketercandidates  | `{ inviteToken: 1 }`                             | yes (sparse) |
| forwardedopenings   | `{ marketerId: 1, candidateEmail: 1, jobId: 1 }` | yes          |
| forwardedopenings   | `{ candidateEmail: 1, createdAt: -1 }`           | no           |
| companyinvites      | `{ companyId: 1, candidateEmail: 1 }`            | yes          |
| companyinvites      | `{ token: 1 }`                                   | yes          |
| projectfinancials   | `{ applicationId: 1, marketerId: 1 }`            | yes          |
| projectfinancials   | `{ marketerId: 1, candidateId: 1 }`              | no           |
| timesheets          | `{ candidateId: 1, weekStart: 1 }`               | yes          |
| timesheets          | `{ marketerId: 1, status: 1 }`                   | no           |
| timesheets          | `{ candidateId: 1, weekStart: -1 }`              | no           |
| interviewinvites    | `{ vendorId: 1, createdAt: -1 }`                 | no           |
| interviewinvites    | `{ candidateEmail: 1, createdAt: -1 }`           | no           |
| companyadmins       | `{ companyId: 1 }`                               | yes          |
| companyadmins       | `{ adminUserId: 1 }`                             | yes          |
| companyadmins       | `{ adminEmail: 1 }`                              | no           |
| companyusers        | `{ companyId: 1, userId: 1 }`                    | yes          |
| companyusers        | `{ companyId: 1, email: 1 }`                     | yes          |
| companyusers        | `{ companyId: 1, role: 1 }`                      | no           |
| companyusers        | `{ companyId: 1, status: 1 }`                    | no           |
| employeeinvitations | `{ companyId: 1, inviteeEmail: 1 }`              | no           |
| employeeinvitations | `{ expiresAt: 1 }`                               | no           |
| clientcompanies     | `{ employerId: 1, name: 1 }`                     | yes          |
| vendorcompanies     | `{ employerId: 1, name: 1 }`                     | yes          |
| subscriptionplans   | `{ slug: 1 }`                                    | yes          |

---

## Relationships (manual � no populate)

All IDs are `String` type. No `ObjectId` refs. No `populate()`.
Relationships resolved via separate queries + Map lookups for efficiency.

```
User._id --(1:1)--? Subscription.userId
User._id --(1:N)--? RefreshToken.userId
User._id --(1:N)--? CandidatePayment.userId
User._id --(1:1)--? CandidateProfile.candidateId
User._id --(1:N)--? Job.vendorId
User._id --(1:N)--? Application.candidateId
Job._id  --(1:N)--? Application.jobId
User._id --(1:1)--? Company.marketerId
Company._id --(1:N)--? EmployerCandidate.companyId
Company._id --(1:N)--? ForwardedOpening.companyId
Company._id --(1:N)--? CompanyInvite.companyId
Company._id --(1:1)--? CompanyAdmin.companyId
Company._id --(1:N)--? CompanyUser.companyId
Company._id --(1:N)--? EmployeeInvitation.companyId
Company._id --(1:N)--? ClientCompany.employerId (via admin)
Company._id --(1:N)--? VendorCompany.employerId (via admin)
CompanyAdmin.subscriptionPlanId --|--? SubscriptionPlan._id
Application._id --(1:1)--? ProjectFinancial.applicationId
User._id --(1:N)--? Timesheet.candidateId
```

---

## Enum-like String Values

| Field                          | Values                                         |
| ------------------------------ | ---------------------------------------------- |
| User.userType                  | `candidate`, `vendor`, `marketer`              |
| Subscription.plan              | `free`, `pro`, `enterprise`                    |
| Subscription.status            | `active`, `inactive`, `canceled`, `past_due`   |
| Job.jobType                    | `contract`, `fulltime`, `parttime`             |
| Job.jobSubType                 | `c2c`, `w2`, `1099`, `""`                      |
| Job.workMode                   | `remote`, `hybrid`, `onsite`, `""`             |
| Application.status             | `pending`, `shortlisted`, `rejected`, `hired`  |
| PokeRecord.senderType          | `candidate`, `vendor`                          |
| EmployerCandidate.inviteStatus | `none`, `sent`, `accepted`                     |
| ForwardedOpening.status        | `pending`, `applied`, `dismissed`              |
| CompanyInvite.status           | `pending`, `accepted`, `declined`              |
| ProjectFinancial.status        | `active`, `completed`, `cancelled`             |
| Timesheet.status               | `draft`, `submitted`, `approved`, `rejected`   |
| InterviewInvite.status         | `pending`, `accepted`, `declined`              |
| CandidatePayment.status        | `pending`, `completed`, `failed`               |
| CompanyUser.role               | `admin`, `manager`, `vendor`, `marketer`       |
| CompanyUser.department         | `accounts`, `immigration`, `placement`, `null` |
| CompanyUser.status             | `active`, `invited`, `deactivated`             |
| CompanyUser.onlineStatus       | `online`, `away`, `offline`                    |
| EmployeeInvitation.status      | `pending`, `accepted`, `expired`, `revoked`    |
| SubscriptionPlan.slug          | `starter`, `growth`, `business`, `enterprise`  |

---

## Connection Strings

| Environment | Shell Services                                  | Jobs Services                               |
| ----------- | ----------------------------------------------- | ------------------------------------------- |
| Local       | `mongodb+srv://...@matchdb.../matchdb-shell`    | `mongodb+srv://...@matchdb.../matchdb-jobs` |
| Development | `mongodb+srv://...@matchdb.../matchdb-shell`    | `mongodb+srv://...@matchdb.../matchdb-jobs` |
| QA          | `mongodb+srv://...@matchdb.../matchdb-shell-qa` | `mongodb+srv://...@matchdb.../matchdb-jobs` |
| Production  | `mongodb+srv://...@matchdb.../matchdb-shell`    | `mongodb+srv://...@matchdb.../matchdb-jobs` |

All environments connect to the same MongoDB Atlas cluster.
Connection strings are stored in `env/.env.{NODE_ENV}` files within each service.
