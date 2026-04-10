import { PrismaClient } from "@prisma/client";
import { upsertSeedRoutes } from "../src/test/fixtures/seed-routes.js";

const prisma = new PrismaClient();

async function main() {
  await upsertSeedRoutes(prisma);
  console.log("Seeded 5 routes (baseline: R002).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
