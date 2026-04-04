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

// Employer (combined vendor + marketer)
const ADMIN_EMPLOYER_ID = "eeeeeeee-0001-0001-0001-eeeeeeeeeeee";

// Additional vendors (2)
const V2 = "vvvvvvvv-0002-0002-0002-vvvvvvvvvvvv";
const V3 = "vvvvvvvv-0003-0003-0003-vvvvvvvvvvvv";

// Employer candidates (10)
const EC1 = "eccccccc-0001-0001-0001-eccccccccccc";
const EC2 = "eccccccc-0002-0002-0002-eccccccccccc";
const EC3 = "eccccccc-0003-0003-0003-eccccccccccc";
const EC4 = "eccccccc-0004-0004-0004-eccccccccccc";
const EC5 = "eccccccc-0005-0005-0005-eccccccccccc";
const EC6 = "eccccccc-0006-0006-0006-eccccccccccc";
const EC7 = "eccccccc-0007-0007-0007-eccccccccccc";
const EC8 = "eccccccc-0008-0008-0008-eccccccccccc";
const EC9 = "eccccccc-0009-0009-0009-eccccccccccc";
const EC10 = "eccccccc-0010-0010-0010-eccccccccccc";

const ADMIN_PW = "admin@123";
const TEST_PW = "Test1234!";

// ── 4 new employer admins (one per shell subscription tier) ──
const ADMIN_DELTA = "dddddddd-0001-0001-0001-dddddddddddd"; // free
const ADMIN_EPSILON = "dddddddd-0002-0002-0002-dddddddddddd"; // basic
const ADMIN_ZETA = "dddddddd-0003-0003-0003-dddddddddddd"; // pro
const ADMIN_ETA = "dddddddd-0004-0004-0004-dddddddddddd"; // pro_plus

// ── 24 employer employees (6 roles × 4 companies) ──
// Delta Solutions employees (manager, vendor, marketer_accounts, marketer_immigration, marketer_placement)
const DE1 = "deeee001-0001-0001-0001-deeee0010001";
const DE2 = "deeee002-0002-0002-0002-deeee0020002";
const DE3 = "deeee003-0003-0003-0003-deeee0030003";
const DE4 = "deeee004-0004-0004-0004-deeee0040004";
const DE5 = "deeee005-0005-0005-0005-deeee0050005";
// Epsilon Tech employees
const EE1 = "epeee001-0001-0001-0001-epeee0010001";
const EE2 = "epeee002-0002-0002-0002-epeee0020002";
const EE3 = "epeee003-0003-0003-0003-epeee0030003";
const EE4 = "epeee004-0004-0004-0004-epeee0040004";
const EE5 = "epeee005-0005-0005-0005-epeee0050005";
// Zeta Corp employees
const ZE1 = "zteee001-0001-0001-0001-zteee0010001";
const ZE2 = "zteee002-0002-0002-0002-zteee0020002";
const ZE3 = "zteee003-0003-0003-0003-zteee0030003";
const ZE4 = "zteee004-0004-0004-0004-zteee0040004";
const ZE5 = "zteee005-0005-0005-0005-zteee0050005";
// Eta Industries employees
const HE1 = "hteee001-0001-0001-0001-hteee0010001";
const HE2 = "hteee002-0002-0002-0002-hteee0020002";
const HE3 = "hteee003-0003-0003-0003-hteee0030003";
const HE4 = "hteee004-0004-0004-0004-hteee0040004";
const HE5 = "hteee005-0005-0005-0005-hteee0050005";

const oid = () => new mongoose.Types.ObjectId().toString();

async function seed() {
  await connectMongo();
  console.log("🌱 Seeding matchingdb-shell database...\n");

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
      userType: "employer",
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
      userType: "employer",
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
      userType: "employer",
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

    // ── Additional Employers (2) ──
    {
      _id: V2,
      email: "frank.miller@test.com",
      password: testHash,
      username: "frank-miller-v00002",
      firstName: "Frank",
      lastName: "Miller",
      userType: "employer",
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
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },

    // ── Employer (combined vendor + marketer) ──
    {
      _id: ADMIN_EMPLOYER_ID,
      email: "admin@employer.com",
      password: adminHash,
      username: "admin-employer-e00001",
      firstName: "Admin",
      lastName: "Employer",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },

    // ── Delta Solutions (Free plan) — admin + 5 employees ──
    {
      _id: ADMIN_DELTA,
      email: "admin@delta.com",
      password: adminHash,
      username: "admin-delta-d00001",
      firstName: "Admin",
      lastName: "Delta",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: DE1,
      email: "manager@delta.com",
      password: testHash,
      username: "manager-delta-de001",
      firstName: "Dana",
      lastName: "Manager",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: DE2,
      email: "vendor@delta.com",
      password: testHash,
      username: "vendor-delta-de002",
      firstName: "Derek",
      lastName: "Vendor",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: DE3,
      email: "accounts@delta.com",
      password: testHash,
      username: "accounts-delta-de003",
      firstName: "Donna",
      lastName: "Accounts",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: DE4,
      email: "immigration@delta.com",
      password: testHash,
      username: "immigration-delta-de004",
      firstName: "Dylan",
      lastName: "Immigration",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: DE5,
      email: "placement@delta.com",
      password: testHash,
      username: "placement-delta-de005",
      firstName: "Diana",
      lastName: "Placement",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },

    // ── Epsilon Tech (Basic plan) — admin + 5 employees ──
    {
      _id: ADMIN_EPSILON,
      email: "admin@epsilon.com",
      password: adminHash,
      username: "admin-epsilon-ep0001",
      firstName: "Admin",
      lastName: "Epsilon",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: EE1,
      email: "manager@epsilon.com",
      password: testHash,
      username: "manager-epsilon-ee001",
      firstName: "Eva",
      lastName: "Manager",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: EE2,
      email: "vendor@epsilon.com",
      password: testHash,
      username: "vendor-epsilon-ee002",
      firstName: "Ethan",
      lastName: "Vendor",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: EE3,
      email: "accounts@epsilon.com",
      password: testHash,
      username: "accounts-epsilon-ee003",
      firstName: "Ellen",
      lastName: "Accounts",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: EE4,
      email: "immigration@epsilon.com",
      password: testHash,
      username: "immigration-epsilon-ee004",
      firstName: "Erik",
      lastName: "Immigration",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: EE5,
      email: "placement@epsilon.com",
      password: testHash,
      username: "placement-epsilon-ee005",
      firstName: "Elise",
      lastName: "Placement",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },

    // ── Zeta Corp (Pro plan) — admin + 5 employees ──
    {
      _id: ADMIN_ZETA,
      email: "admin@zeta.com",
      password: adminHash,
      username: "admin-zeta-zt0001",
      firstName: "Admin",
      lastName: "Zeta",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: ZE1,
      email: "manager@zeta.com",
      password: testHash,
      username: "manager-zeta-ze001",
      firstName: "Zara",
      lastName: "Manager",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: ZE2,
      email: "vendor@zeta.com",
      password: testHash,
      username: "vendor-zeta-ze002",
      firstName: "Zach",
      lastName: "Vendor",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: ZE3,
      email: "accounts@zeta.com",
      password: testHash,
      username: "accounts-zeta-ze003",
      firstName: "Zoe",
      lastName: "Accounts",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: ZE4,
      email: "immigration@zeta.com",
      password: testHash,
      username: "immigration-zeta-ze004",
      firstName: "Zane",
      lastName: "Immigration",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: ZE5,
      email: "placement@zeta.com",
      password: testHash,
      username: "placement-zeta-ze005",
      firstName: "Zelda",
      lastName: "Placement",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },

    // ── Eta Industries (Pro Plus plan) — admin + 5 employees ──
    {
      _id: ADMIN_ETA,
      email: "admin@eta.com",
      password: adminHash,
      username: "admin-eta-ht0001",
      firstName: "Admin",
      lastName: "Eta",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: HE1,
      email: "manager@eta.com",
      password: testHash,
      username: "manager-eta-he001",
      firstName: "Hannah",
      lastName: "Manager",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: HE2,
      email: "vendor@eta.com",
      password: testHash,
      username: "vendor-eta-he002",
      firstName: "Henry",
      lastName: "Vendor",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: HE3,
      email: "accounts@eta.com",
      password: testHash,
      username: "accounts-eta-he003",
      firstName: "Hazel",
      lastName: "Accounts",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: HE4,
      email: "immigration@eta.com",
      password: testHash,
      username: "immigration-eta-he004",
      firstName: "Hugo",
      lastName: "Immigration",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: HE5,
      email: "placement@eta.com",
      password: testHash,
      username: "placement-eta-he005",
      firstName: "Helena",
      lastName: "Placement",
      userType: "employer",
      isActive: true,
      hasPurchasedVisibility: false,
    },

    // ── Employer Candidates (10) ──
    {
      _id: EC1,
      email: "carlos.reyes@test.com",
      password: testHash,
      username: "carlos-reyes-ec00001",
      firstName: "Carlos",
      lastName: "Reyes",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: EC2,
      email: "mei.zhang@test.com",
      password: testHash,
      username: "mei-zhang-ec00002",
      firstName: "Mei",
      lastName: "Zhang",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: EC3,
      email: "aisha.khan@test.com",
      password: testHash,
      username: "aisha-khan-ec00003",
      firstName: "Aisha",
      lastName: "Khan",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: EC4,
      email: "daniel.oconnor@test.com",
      password: testHash,
      username: "daniel-oconnor-ec00004",
      firstName: "Daniel",
      lastName: "O'Connor",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: EC5,
      email: "yuki.tanaka@test.com",
      password: testHash,
      username: "yuki-tanaka-ec00005",
      firstName: "Yuki",
      lastName: "Tanaka",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: EC6,
      email: "fatima.ali@test.com",
      password: testHash,
      username: "fatima-ali-ec00006",
      firstName: "Fatima",
      lastName: "Ali",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: EC7,
      email: "lucas.silva@test.com",
      password: testHash,
      username: "lucas-silva-ec00007",
      firstName: "Lucas",
      lastName: "Silva",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: false,
    },
    {
      _id: EC8,
      email: "anna.kowalski@test.com",
      password: testHash,
      username: "anna-kowalski-ec00008",
      firstName: "Anna",
      lastName: "Kowalski",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: EC9,
      email: "raj.krishnan@test.com",
      password: testHash,
      username: "raj-krishnan-ec00009",
      firstName: "Raj",
      lastName: "Krishnan",
      userType: "candidate",
      isActive: true,
      hasPurchasedVisibility: true,
    },
    {
      _id: EC10,
      email: "elena.volkov@test.com",
      password: testHash,
      username: "elena-volkov-ec00010",
      firstName: "Elena",
      lastName: "Volkov",
      userType: "candidate",
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
      base.plan = "pro_plus";
      base.currentPeriodEnd = oneYearFromNow;
    }
    if (u._id === ADMIN_MARKETER2_ID) {
      base.plan = "pro_plus";
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
    // Employer gets top-tier plan
    if (u._id === ADMIN_EMPLOYER_ID) {
      base.plan = "pro_plus";
      base.currentPeriodEnd = oneYearFromNow;
    }
    // Delta Solutions — Free plan (all employees stay free)
    // (no override needed, default is "free")
    // Epsilon Tech — Basic plan
    if ([ADMIN_EPSILON, EE1, EE2, EE3, EE4, EE5].includes(u._id)) {
      base.plan = "basic";
      base.currentPeriodEnd = oneYearFromNow;
    }
    // Zeta Corp — Pro plan
    if ([ADMIN_ZETA, ZE1, ZE2, ZE3, ZE4, ZE5].includes(u._id)) {
      base.plan = "pro";
      base.currentPeriodEnd = oneYearFromNow;
    }
    // Eta Industries — Pro Plus plan
    if ([ADMIN_ETA, HE1, HE2, HE3, HE4, HE5].includes(u._id)) {
      base.plan = "pro_plus";
      base.currentPeriodEnd = oneYearFromNow;
    }
    return base;
  });
  const subscriptions = await Subscription.insertMany(subData);
  console.log(`  ✓ Created ${subscriptions.length} subscriptions`);

  // ─── CandidatePayments ───────────────────────────────────
  const payingCandidates = [
    C1,
    C2,
    C4,
    C6,
    C8,
    C10,
    EC1,
    EC2,
    EC3,
    EC4,
    EC6,
    EC8,
    EC9,
  ];
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
  console.log("   admin@vendor.com    — Employer (Pro Plus, full access)");
  console.log("   admin@marketer.com  — Employer (Pro Plus, full access)");
  console.log("   admin@markerter.com — Employer (Pro Plus, full access)");
  console.log("   admin@employer.com  — Employer (Pro Plus, full access)");
  console.log("   admin@delta.com     — Employer (Free plan)");
  console.log("   admin@epsilon.com   — Employer (Basic plan)");
  console.log("   admin@zeta.com      — Employer (Pro plan)");
  console.log("   admin@eta.com       — Employer (Pro Plus plan)");
  console.log("\n📋 Employer employees (password: Test1234!):");
  console.log(
    "   Delta (Free):     manager|vendor|accounts|immigration|placement @delta.com",
  );
  console.log(
    "   Epsilon (Basic):  manager|vendor|accounts|immigration|placement @epsilon.com",
  );
  console.log(
    "   Zeta (Pro):       manager|vendor|accounts|immigration|placement @zeta.com",
  );
  console.log(
    "   Eta (Pro Plus):   manager|vendor|accounts|immigration|placement @eta.com",
  );
  console.log("\n📋 Test accounts (password: Test1234!):");
  console.log(
    "   10 candidates: alice.johnson@test.com … omar.hassan@test.com",
  );
  console.log(
    "   10 employer candidates: carlos.reyes@test.com … elena.volkov@test.com",
  );
  console.log("   2 employers: frank.miller@test.com, sarah.lee@test.com\n");

  await disconnectMongo();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
