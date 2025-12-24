import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"], // * enable query logging in Dev (optional)
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma; // * make sure to reuse the same instance in Dev
}

export default prisma;
