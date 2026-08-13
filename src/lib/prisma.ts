import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
