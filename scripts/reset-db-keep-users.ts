/**
 * Wipe all app data except the User table (keeps logins for retesting).
 *
 *   npx tsx scripts/reset-db-keep-users.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const KEEP = new Set(["User", "user", "_prisma_migrations"]);

async function main() {
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, string>>>(
    "SHOW TABLES"
  );
  const tables = rows
    .map((row) => Object.values(row)[0])
    .filter((name): name is string => Boolean(name) && !KEEP.has(name));

  if (tables.length === 0) {
    console.log("No tables to clear (only User / migrations present).");
    return;
  }

  // One connection so FOREIGN_KEY_CHECKS stays off for every TRUNCATE.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of tables) {
      await tx.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
      console.log(`  truncated: ${table}`);
    }
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
  });

  const usersLeft = await prisma.user.count();
  console.log(`\nDone. Users remaining: ${usersLeft}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
