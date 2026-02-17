/**
 * Seed script – creates dummy users + subscriptions in PostgreSQL
 * Run: DATABASE_URL=... npx tsx seed.ts
 *
 * Fixed UUIDs so the jobs-services seed can reference them.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const HASH = await bcrypt.hash('Password1!', 10);

  const users = [
    // ── Candidates (10) ──
    { id: '3458c125-290a-4d47-ac8a-c151f7241ec6', email: 'alice@example.com',     firstName: 'Alice',    lastName: 'Johnson',    userType: 'candidate' as const, plan: 'pro' as const },
    { id: 'b444f8a3-a43c-44dc-be78-9c400e4c395a', email: 'bob@example.com',       firstName: 'Bob',      lastName: 'Smith',      userType: 'candidate' as const, plan: 'free' as const },
    { id: '3f7616df-ebff-4b2b-b0b9-b9b5d539593f', email: 'carol@example.com',     firstName: 'Carol',    lastName: 'Davis',      userType: 'candidate' as const, plan: 'free' as const },
    { id: 'a1b2c3d4-1111-4aaa-b111-000000000001', email: 'grace@devmail.com',     firstName: 'Grace',    lastName: 'Lee',        userType: 'candidate' as const, plan: 'pro' as const },
    { id: 'a1b2c3d4-1111-4aaa-b111-000000000002', email: 'hank@coderz.io',        firstName: 'Hank',     lastName: 'Patel',      userType: 'candidate' as const, plan: 'free' as const },
    { id: 'a1b2c3d4-1111-4aaa-b111-000000000003', email: 'irene@webdev.com',      firstName: 'Irene',    lastName: 'Garcia',     userType: 'candidate' as const, plan: 'enterprise' as const },
    { id: 'a1b2c3d4-1111-4aaa-b111-000000000004', email: 'jack@stackhire.com',    firstName: 'Jack',     lastName: 'Thompson',   userType: 'candidate' as const, plan: 'free' as const },
    { id: 'a1b2c3d4-1111-4aaa-b111-000000000005', email: 'karen@datapro.net',     firstName: 'Karen',    lastName: 'White',      userType: 'candidate' as const, plan: 'pro' as const },
    { id: 'a1b2c3d4-1111-4aaa-b111-000000000006', email: 'leo@cloudops.dev',      firstName: 'Leo',      lastName: 'Martinez',   userType: 'candidate' as const, plan: 'free' as const },
    { id: 'a1b2c3d4-1111-4aaa-b111-000000000007', email: 'mia@appforge.io',       firstName: 'Mia',      lastName: 'Robinson',   userType: 'candidate' as const, plan: 'pro' as const },

    // ── Vendors (7) ──
    { id: 'd8c0acdc-07f4-4f4e-9b71-5e0f6d0f1745', email: 'dan@techcorp.com',      firstName: 'Dan',      lastName: 'Brown',      userType: 'vendor' as const,    plan: 'pro' as const },
    { id: 'b25adc3b-d440-470f-9390-54794dd95f89', email: 'eve@startup.io',        firstName: 'Eve',      lastName: 'Wilson',     userType: 'vendor' as const,    plan: 'enterprise' as const },
    { id: '379a35d5-c33b-46ec-8c7a-79ec54d4378b', email: 'frank@agency.com',      firstName: 'Frank',    lastName: 'Miller',     userType: 'vendor' as const,    plan: 'free' as const },
    { id: 'a1b2c3d4-2222-4bbb-b222-000000000001', email: 'nina@recruit.co',       firstName: 'Nina',     lastName: 'Chen',       userType: 'vendor' as const,    plan: 'pro' as const },
    { id: 'a1b2c3d4-2222-4bbb-b222-000000000002', email: 'oscar@hiringlab.com',   firstName: 'Oscar',    lastName: 'Nguyen',     userType: 'vendor' as const,    plan: 'enterprise' as const },
    { id: 'a1b2c3d4-2222-4bbb-b222-000000000003', email: 'paula@talentedge.io',   firstName: 'Paula',    lastName: 'Kim',        userType: 'vendor' as const,    plan: 'pro' as const },
    { id: 'a1b2c3d4-2222-4bbb-b222-000000000004', email: 'quinn@staffplus.com',   firstName: 'Quinn',    lastName: 'Adams',      userType: 'vendor' as const,    plan: 'free' as const },
  ];

  await prisma.user.deleteMany();

  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        password: HASH,
        firstName: u.firstName,
        lastName: u.lastName,
        userType: u.userType,
        isActive: true,
        subscription: {
          create: {
            plan: u.plan,
            status: u.plan === 'free' ? 'inactive' : 'active',
          },
        },
      },
    });
    console.log(`Created ${u.userType}: ${u.email} [${u.plan}] → id: ${user.id}`);
  }

  await prisma.$disconnect();
  console.log('\nDone. All users password: Password1!');
}

main().catch((e) => { console.error(e); process.exit(1); });
