#!/usr/bin/env node
/**
 * Switches the Prisma schema `provider` between "sqlite" and "postgresql"
 * based on NODE_ENV.  Run automatically via the npm `predev` / `prebuild` hooks.
 *
 * Usage:
 *   node prisma/set-provider.js          # reads NODE_ENV (default = sqlite)
 *   node prisma/set-provider.js sqlite
 *   node prisma/set-provider.js postgresql
 */
const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf8");

// Determine desired provider
let provider;
const arg = process.argv[2];
if (arg === "sqlite" || arg === "postgresql") {
  provider = arg;
} else {
  const env = process.env.NODE_ENV || "development";
  provider = env === "production" ? "postgresql" : "sqlite";
}

const updated = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${provider}"`,
);

if (updated !== schema) {
  fs.writeFileSync(schemaPath, updated, "utf8");
  console.log(`[prisma] Schema provider → ${provider}`);
} else {
  console.log(`[prisma] Schema provider already ${provider}`);
}
