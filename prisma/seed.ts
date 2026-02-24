/**
 * MatchDB — Production Database Seed
 * Run: npx prisma db seed
 *
 * Creates:
 *  • 1 admin account
 *  • 2 candidate accounts (free, and one with full visibility)
 *  • 2 vendor accounts (basic, pro)
 *
 * All passwords follow the pattern shown below — change before deploying!
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------- account definitions ----------
const ACCOUNTS = [
  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    email:      "admin@matchingdb.com",
    password:   "MatchDB@Admin2026!",
    firstName:  "System",
    lastName:   "Admin",
    userType:   "admin",
    plan:       "pro_plus",
    membershipConfig: null,
    hasPurchasedVisibility: false,
  },

  // ── Candidates ────────────────────────────────────────────────────────────
  {
    email:      "candidate1@matchingdb.com",
    password:   "Candidate1@2026",
    firstName:  "Alex",
    lastName:   "Morgan",
    userType:   "candidate",
    plan:       "free",
    membershipConfig: null,
    hasPurchasedVisibility: false,
  },
  {
    email:      "candidate2@matchingdb.com",
    password:   "Candidate2@2026",
    firstName:  "Sara",
    lastName:   "Chen",
    userType:   "candidate",
    plan:       "free",
    // Full visibility: all 8 subdomains across both domains
    membershipConfig: JSON.stringify({
      contract:  ["c2c", "c2h", "w2", "1099"],
      full_time: ["c2h", "w2", "direct_hire", "salary"],
    }),
    hasPurchasedVisibility: true,
  },

  // ── Vendors ───────────────────────────────────────────────────────────────
  {
    email:      "vendor1@matchingdb.com",
    password:   "Vendor1@2026",
    firstName:  "Raj",
    lastName:   "Patel",
    userType:   "vendor",
    plan:       "basic",
    membershipConfig: null,
    hasPurchasedVisibility: false,
  },
  {
    email:      "vendor2@matchingdb.com",
    password:   "Vendor2@2026",
    firstName:  "Jennifer",
    lastName:   "Blake",
    userType:   "vendor",
    plan:       "pro",
    membershipConfig: null,
    hasPurchasedVisibility: false,
  },
];

// ---------- helper ----------
function slug(first: string, last: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${first.toLowerCase()}-${last.toLowerCase()}-${rand}`;
}

// ---------- main ----------
async function main() {
  console.log("🌱  Seeding MatchDB...\n");

  for (const acct of ACCOUNTS) {
    const hashed = await bcrypt.hash(acct.password, 12);

    const user = await prisma.user.upsert({
      where:  { email: acct.email },
      update: {},
      create: {
        email:                  acct.email,
        password:               hashed,
        firstName:              acct.firstName,
        lastName:               acct.lastName,
        username:               slug(acct.firstName, acct.lastName),
        userType:               acct.userType,
        membershipConfig:       acct.membershipConfig,
        hasPurchasedVisibility: acct.hasPurchasedVisibility,
        isActive:               true,
      },
    });

    // Every user gets a subscription row (free by default)
    await prisma.subscription.upsert({
      where:  { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        plan:   acct.plan,
        status: acct.plan === "free" ? "inactive" : "active",
      },
    });

    const badge =
      acct.userType === "admin"     ? "🔑 admin    " :
      acct.userType === "vendor"    ? "🏢 vendor   " :
                                      "👤 candidate";
    console.log(`  ${badge}  ${acct.email}  [${acct.plan}]`);
  }

  console.log("\n✅  Done.\n");
  console.log("Credentials (change in production!):");
  console.log("─────────────────────────────────────────────────────────");
  for (const a of ACCOUNTS) {
    console.log(`  ${a.email.padEnd(32)} ${a.password}`);
  }
  console.log("─────────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
