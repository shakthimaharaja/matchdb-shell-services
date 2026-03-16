import { env } from "./config/env";
import { connectMongo, disconnectMongo } from "./config/mongoose";
import app from "./app";

async function main() {
  // Connect to MongoDB
  await connectMongo();
  console.log("[DB] MongoDB connected");

  app.listen(env.PORT, () => {
    console.log(
      `[Server] matchdb-shell-services running on port ${env.PORT} (${env.NODE_ENV})`,
    );
  });
}

main().catch((err) => {
  console.error("[Fatal] Server failed to start:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await disconnectMongo();
  process.exit(0);
});
