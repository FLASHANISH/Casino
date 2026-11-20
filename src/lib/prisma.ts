import { PrismaClient } from "@prisma/client";

// PrismaClient singleton for Next.js serverless: re-use the client across
// hot reloads / warm invocations instead of opening a new pool per request.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
