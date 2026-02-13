import { env } from './config/env';
import { prisma } from './config/prisma';
import app from './app';

async function main() {
  // Test database connection
  await prisma.$connect();
  console.log('[DB] PostgreSQL connected via Prisma');

  app.listen(env.PORT, () => {
    console.log(`[Server] matchdb-shell-services running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error('[Fatal] Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
