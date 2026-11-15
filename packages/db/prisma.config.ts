import { existsSync } from "node:fs";

import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env by itself.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // `prisma generate` needs no database; migrate commands fail clearly without one.
  ...(url ? { datasource: { url } } : {}),
});
