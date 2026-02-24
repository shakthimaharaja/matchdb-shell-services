import { PrismaClient } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

// In cluster mode each PM2 worker gets its own Prisma instance.
// connection_limit is set per-worker via DATABASE_URL query params.
export const prisma = new PrismaClient({
  log: isProd ? ['error'] : ['query', 'error', 'warn'],
});
