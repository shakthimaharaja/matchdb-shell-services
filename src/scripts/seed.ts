import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { connectMongo, disconnectMongo } from "../config/mongoose";
import { User, Subscription, RefreshToken, CandidatePayment } from "../models";

/* ------------------------------------------------------------------ */
/*  Deterministic IDs — shared with jobs-services seed                 */
/* ------------------------------------------------------------------ */
// Admin accounts
const ADMIN_VENDOR_ID = "aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa";
const ADMIN_MARKETER_ID = "aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa";
const ADMIN_MARKETER2_ID = "aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa";

// Candidates (10)
const C1 = "cccccccc-0001-0001-0001-cccccccccccc";
const C2 = "cccccccc-0002-0002-0002-cccccccccccc";
const C3 = "cccccccc-0003-0003-0003-cccccccccccc";
const C4 = "cccccccc-0004-0004-0004-cccccccccccc";
const C5 = "cccccccc-0005-0005-0005-cccccccccccc";
const C6 = "cccccccc-0006-0006-0006-cccccccccccc";
const C7 = "cccccccc-0007-0007-0007-cccccccccccc";
const C8 = "cccccccc-0008-0008-0008-cccccccccccc";
const C9 = "cccccccc-0009-0009-0009-cccccccccccc";
const C10 = "cccccccc-0010-0010-0010-cccccccccccc";

// Additional vendors (2)
const V2 = "vvvvvvvv-0002-0002-0002-vvvvvvvvvvvv";
const V3 = "vvvvvvvv-0003-0003-0003-vvvvvvvvvvvv";

const ADMIN_PW = "admin@123";
const TEST_PW = "Test1234!";

const oid = () => new mongoose.Types.ObjectId().toString();

async function seed() {
  await connectMongo();
  console.log("🌱 Seeding matchdb-shell database...\n");

  // Drop and recreate collections to clear stale indexes
  const db = mongoose.connection.db!;
  const cols = new Set(
    (await db.listCollections().toArray()).map((c) => c.name),
  );
  for (const name of [
    "users",
    "subscriptions",
    "refreshtokens",
    "candidatepayments",
  ]) {
    if (cols.has(name)) await db.dropCollection(name);
  }
  await Promise.all([
    User.createCollection(),
    Subscription.createCollection(),
    RefreshToken.createCollection(),
    CandidatePayment.createCollection(),
  ]);
  console.log("  ✓ Dropped and recreated all collections");

  const adminHash = await bcrypt.hash(ADMIN_PW, 12);
  const testHash = await bcrypt.hash(TEST_PW, 12);

  // ─── Users ────────────────────────────────────────────────
  const users = await User.insertMany([
    // ── Admin Accounts ──
    {
      _id: ADMIN_VENDOR_ID,
      email: "admin@vendor.com",
      password: adminHash,
      username: "admin-vendor-a00001",
      firstName: "Admin",
      lastName: "Vendor",
      userType: "vendor",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: ADMIN_MARKETER_ID,
      email: "admin@marketer.com",
      password: adminHash,
      username: "admin-marketer-a00002",
      firstName: "Admin",
      lastName: "Marketer",
      userType: "marketer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: ADMIN_MARKETER2_ID,
      email: "admin@markerter.com",
      password: adminHash,
      username: "admin-markerter-a00003",
      firstName: "Admin",
      lastName: "Markerter",
      userType: "marketer",
      isActive: true,
      hasPurchasedVisibility: false,
    },

    // ── Candidates (10) ──
    {
      _id: C1,
      email: "alice.johnson@test.com",
      password: testHash,
      username: "alice-johnson-c00001",
      firstName: "Alice",
      lastName: "Johnson",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: C2,
      email: "dave.brown@test.com",
      password: testHash,
      username: "dave-brown-c00002",
      firstName: "Dave",
      lastName: "Brown",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: C3,
      email: "emma.davis@test.com",
      password: testHash,
      username: "emma-davis-c00003",
      firstName: "Emma",
      lastName: "Davis",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: C4,
      email: "rahul.sharma@test.com",
      password: testHash,
      username: "rahul-sharma-c00004",
      firstName: "Rahul",
      lastName: "Sharma",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: C5,
      email: "priya.patel@test.com",
      password: testHash,
      username: "priya-patel-c00005",
      firstName: "Priya",
      lastName: "Patel",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: C6,
      email: "james.wilson@test.com",
      password: testHash,
      username: "james-wilson-c00006",
      firstName: "James",
      lastName: "Wilson",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: C7,
      email: "sophia.martinez@test.com",
      password: testHash,
      username: "sophia-martinez-c00007",
      firstName: "Sophia",
      lastName: "Martinez",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: C8,
      email: "liam.chen@test.com",
      password: testHash,
      username: "liam-chen-c00008",
      firstName: "Liam",
      lastName: "Chen",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: C9,
      email: "nina.gupta@test.com",
      password: testHash,
      username: "nina-gupta-c00009",
      firstName: "Nina",
      lastName: "Gupta",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: C10,
      email: "omar.hassan@test.com",
      password: testHash,
      username: "omar-hassan-c00010",
      firstName: "Omar",
      lastName: "Hassan",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },

    // ── Additional Vendors (2) ──
    {
      _id: V2,
      email: "frank.miller@test.com",
      password: testHash,
      username: "frank-miller-v00002",
      firstName: "Frank",
      lastName: "Miller",
      userType: "vendor",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: V3,
      email: "sarah.lee@test.com",
      password: testHash,
      username: "sarah-lee-v00003",
      firstName: "Sarah",
      lastName: "Lee",
      userType: "vendor",
      isActive: true,
      hasPurchasedVisibility: false,
    },
  ]);
  console.log(`  ✓ Created ${users.length} users`);

  // ─── Subscriptions ───────────────────────────────────────
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const subData = users.map((u) => {
    const base: {
      _id: string;
      userId: string;
      plan: string;
      status: string;
      currentPeriodEnd: Date | null;
    } = {
      _id: oid(),
      userId: u._id,
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
    };
    // Admin accounts get top-tier plans
    if (u._id === ADMIN_VENDOR_ID) {
      base.plan = "pro_plus";
      base.currentPeriodEnd = oneYearFromNow;
    }
    if (u._id === ADMIN_MARKETER_ID) {
      base.plan = "marketer";
      base.currentPeriodEnd = oneYearFromNow;
    }
    if (u._id === ADMIN_MARKETER2_ID) {
      base.plan = "marketer";
      base.currentPeriodEnd = oneYearFromNow;
    }
    // Other vendors
    if (u._id === V2) {
      base.plan = "pro";
      base.currentPeriodEnd = oneYearFromNow;
    }
    if (u._id === V3) {
      base.plan = "basic";
      base.currentPeriodEnd = oneYearFromNow;
    }
    return base;
  });
  const subscriptions = await Subscription.insertMany(subData);
  console.log(`  ✓ Created ${subscriptions.length} subscriptions`);

  // ─── CandidatePayments ───────────────────────────────────
  const payingCandidates = [C1, C2, C4, C6, C8, C10];
  const payments = await CandidatePayment.insertMany(
    payingCandidates.map((cid) => ({
      _id: oid(),
      userId: cid,
      stripeSessionId: `cs_test_${randomUUID().slice(0, 24)}`,
      stripePaymentIntentId: `pi_test_${randomUUID().slice(0, 24)}`,
      packageType: "visibility_30d",
      domain: "technology",
      subdomains: "frontend,backend,devops",
      amountCents: 2999,
      status: "completed",
    })),
  );
  console.log(`  ✓ Created ${payments.length} candidate payments`);

  console.log("\n✅ Shell database seeded successfully!");
  console.log("\n📋 Admin credentials (password: admin@123):");
  console.log("   admin@vendor.com    — Vendor  (Pro Plus, full access)");
  console.log("   admin@marketer.com  — Marketer (full access)");
  console.log("   admin@markerter.com — Marketer (full access)");
  console.log("\n📋 Test accounts (password: Test1234!):");
  console.log(
    "   10 candidates: alice.johnson@test.com … omar.hassan@test.com",
  );
  console.log("   2 vendors: frank.miller@test.com, sarah.lee@test.com\n");

  await disconnectMongo();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
