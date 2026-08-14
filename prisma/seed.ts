import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const seedUsers = [
  {
    email: "admin@optiphoenix.local",
    name: "Org Admin",
    role: "ADMIN" as const,
    password: "Admin123!",
  },
  {
    email: "lead@optiphoenix.local",
    name: "Team Lead",
    role: "TEAM_LEAD" as const,
    password: "Lead123!",
  },
];

async function main() {
  for (const user of seedUsers) {
    const password = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password,
        status: "APPROVED",
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        password,
        status: "APPROVED",
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  console.log("Seeded login users:");
  console.log("  Admin     admin@optiphoenix.local  /  Admin123!");
  console.log("  Team Lead lead@optiphoenix.local   /  Lead123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
