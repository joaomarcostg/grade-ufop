import "server-only";

import { createPrismaClient, type PrismaClient } from "@grade/db";

// One client per server process; dev reloads reuse it instead of opening new pools.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
