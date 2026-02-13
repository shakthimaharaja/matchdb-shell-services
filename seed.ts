/**
 * Seed script – creates dummy users + subscriptions in PostgreSQL
 * Run: DATABASE_URL=... npx tsx seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const HASH = await bcrypt.hash('Password1!', 10);

  const users = [
    { email: 'alice@example.com', firstName: 'Alice', lastName: 'Johnson', userType: 'candidate' as const, plan: 'pro' as const },
    { email: 'bob@example.com',   firstName: 'Bob',   lastName: 'Smith',   userType: 'candidate' as const, plan: 'free' as const },
    { email: 'carol@example.com', firstName: 'Carol', lastName: 'Davis',   userType: 'candidate' as const, plan: 'free' as const },
    { email: 'dan@techcorp.com',  firstName: 'Dan',   lastName: 'Brown',   userType: 'vendor' as const,    plan: 'pro' as const },
    { email: 'eve@startup.io',    firstName: 'Eve',   lastName: 'Wilson',  userType: 'vendor' as const,    plan: 'enterprise' as const },
    { email: 'frank@agency.com',  firstName: 'Frank', lastName: 'Miller',  userType: 'vendor' as const,    plan: 'free' as const },
  ];

  await prisma.user.deleteMany();

  for (const u of users) {
    const user = await prisma.user.create({
      data: {
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
