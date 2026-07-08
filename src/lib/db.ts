import { PrismaClient } from "@prisma/client";

// Prisma client singleton — avoids exhausting connections across Next.js dev hot-reloads.
// In production this sits behind an external transaction-mode pooler (see Phase 0 plan).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
