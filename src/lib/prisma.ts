import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Bump when Prisma schema fields change so a long-lived `next dev` process
 * does not keep an old PrismaClient on globalThis after `prisma generate`.
 */
const PRISMA_CLIENT_REV = 4;

/** One Prisma client per Node process, with a small MariaDB pool so local MAMP is not opened per query. */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientRev?: number;
};

if (globalForPrisma.prismaClientRev !== PRISMA_CLIENT_REV) {
  void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaClientRev = PRISMA_CLIENT_REV;
}

function createAdapter() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Add it to your .env file.");
  }

  const parsed = new URL(databaseUrl);
  const isLocal =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  const databaseName = (parsed.pathname ?? "")
    .replace(/^\//, "")
    .split("?")[0];

  return new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: databaseName,
    connectionLimit: 8,
    connectTimeout: 15000,
    acquireTimeout: 15000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
