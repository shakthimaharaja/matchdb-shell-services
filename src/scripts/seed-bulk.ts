/**
 * seed-bulk.ts — APPENDS 20 extra candidate users to the shell database.
 * Run AFTER the base `npm run seed` so the admin/vendor/base candidates exist.
 *
 * Usage:  npm run seed:bulk
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { connectMongo, disconnectMongo } from "../config/mongoose";
import { User, Subscription, CandidatePayment } from "../models";

const TEST_PW = "Test1234!";
const oid = () => new mongoose.Types.ObjectId().toString();

/* ── Deterministic IDs — must match jobs-services seed-bulk ─────────── */
const BULK: [string, string, string, string, string, boolean][] = [
  // [id, email, username, firstName, lastName, hasPurchasedVisibility]
  [
    "cccccccc-0011-0011-0011-cccccccccccc",
    "anika.patel@test.com",
    "anika-patel-c00011",
    "Anika",
    "Patel",
    true,
  ],
  [
    "cccccccc-0012-0012-0012-cccccccccccc",
    "marcus.thompson@test.com",
    "marcus-thompson-c00012",
    "Marcus",
    "Thompson",
    false,
  ],
  [
    "cccccccc-0013-0013-0013-cccccccccccc",
    "elena.volkov@test.com",
    "elena-volkov-c00013",
    "Elena",
    "Volkov",
    true,
  ],
  [
    "cccccccc-0014-0014-0014-cccccccccccc",
    "diego.torres@test.com",
    "diego-torres-c00014",
    "Diego",
    "Torres",
    false,
  ],
  [
    "cccccccc-0015-0015-0015-cccccccccccc",
    "yuki.tanaka@test.com",
    "yuki-tanaka-c00015",
    "Yuki",
    "Tanaka",
    true,
  ],
  [
    "cccccccc-0016-0016-0016-cccccccccccc",
    "sarah.mitchell@test.com",
    "sarah-mitchell-c00016",
    "Sarah",
    "Mitchell",
    false,
  ],
  [
    "cccccccc-0017-0017-0017-cccccccccccc",
    "kwame.asante@test.com",
    "kwame-asante-c00017",
    "Kwame",
    "Asante",
    true,
  ],
  [
    "cccccccc-0018-0018-0018-cccccccccccc",
    "mei.lin@test.com",
    "mei-lin-c00018",
    "Mei",
    "Lin",
    false,
  ],
  [
    "cccccccc-0019-0019-0019-cccccccccccc",
    "rafael.costa@test.com",
    "rafael-costa-c00019",
    "Rafael",
    "Costa",
    true,
  ],
  [
    "cccccccc-0020-0020-0020-cccccccccccc",
    "fatima.alrashid@test.com",
    "fatima-alrashid-c00020",
    "Fatima",
    "Al-Rashid",
    false,
  ],
  [
    "cccccccc-0021-0021-0021-cccccccccccc",
    "patrick.obrien@test.com",
    "patrick-obrien-c00021",
    "Patrick",
    "O'Brien",
    true,
  ],
  [
    "cccccccc-0022-0022-0022-cccccccccccc",
    "ingrid.larsson@test.com",
    "ingrid-larsson-c00022",
    "Ingrid",
    "Larsson",
    false,
  ],
  [
    "cccccccc-0023-0023-0023-cccccccccccc",
    "vikram.khanna@test.com",
    "vikram-khanna-c00023",
    "Vikram",
    "Khanna",
    true,
  ],
  [
    "cccccccc-0024-0024-0024-cccccccccccc",
    "natasha.williams@test.com",
    "natasha-williams-c00024",
    "Natasha",
    "Williams",
    false,
  ],
  [
    "cccccccc-0025-0025-0025-cccccccccccc",
    "chen.wei@test.com",
    "chen-wei-c00025",
    "Chen",
    "Wei",
    true,
  ],
  [
    "cccccccc-0026-0026-0026-cccccccccccc",
    "isabella.santos@test.com",
    "isabella-santos-c00026",
    "Isabella",
    "Santos",
    false,
  ],
  [
    "cccccccc-0027-0027-0027-cccccccccccc",
    "alexei.petrov@test.com",
    "alexei-petrov-c00027",
    "Alexei",
    "Petrov",
    true,
  ],
  [
    "cccccccc-0028-0028-0028-cccccccccccc",
    "amara.okafor@test.com",
    "amara-okafor-c00028",
    "Amara",
    "Okafor",
    false,
  ],
  [
    "cccccccc-0029-0029-0029-cccccccccccc",
    "jordan.kim@test.com",
    "jordan-kim-c00029",
    "Jordan",
    "Kim",
    true,
  ],
  [
    "cccccccc-0030-0030-0030-cccccccccccc",
    "leila.hashemi@test.com",
    "leila-hashemi-c00030",
    "Leila",
    "Hashemi",
    false,
  ],
];

async function seedBulk() {
  await connectMongo();
  console.log("🌱 Bulk-seeding 20 extra candidates into matchdb-shell...\n");

  const testHash = await bcrypt.hash(TEST_PW, 12);
  const oneYear = new Date(Date.now() + 365 * 86_400_000);

  const users = await User.insertMany(
    BULK.map(([_id, email, username, firstName, lastName, vis]) => ({
      _id,
      email,
      password: testHash,
      username,
      firstName,
      lastName,
      userType: "candidate" as const,
      isActive: true,
      hasPurchasedVisibility: vis,
    })),
  );
  console.log(`  ✓ Created ${users.length} users`);

  const subs = await Subscription.insertMany(
    users.map((u) => ({
      _id: oid(),
      userId: u._id,
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
    })),
  );
  console.log(`  ✓ Created ${subs.length} subscriptions`);

  // Visibility payments for half the candidates
  const paying = BULK.filter(([, , , , , vis]) => vis);
  const payments = await CandidatePayment.insertMany(
    paying.map(([cid]) => ({
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

  console.log("\n✅ Bulk shell seed complete!\n");
  console.log("📋 All 20 new candidates use password: Test1234!");
  await disconnectMongo();
}

seedBulk().catch((err) => {
  console.error("Bulk seed failed:", err);
  process.exit(1);
});
