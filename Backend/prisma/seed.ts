// prisma/seed.ts
import "../src/config/env.js"; // load global .env (adjust if your path differs)
import { PrismaClient, Route, ShipCompliance, BankEntry, Pool, PoolMember } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Starting TypeScript seed...");

  // --- 1️⃣ ROUTES ---
  const routes: Omit<Route, "id">[] = Array.from({ length: 50 }).map(() => ({
    routeId: faker.string.alphanumeric(6).toUpperCase(),
    year: faker.number.int({ min: 2015, max: 2025 }),
    vesselType: faker.helpers.arrayElement(["Cargo", "Tanker", "Ferry", "Cruise", "Bulk"]),
    fuelType: faker.helpers.arrayElement(["HFO", "MDO", "LNG", "Biofuel"]),
    fuelConsumption: faker.number.int({ min: 500, max: 15000 }),
    distance: faker.number.int({ min: 100, max: 20000 }),
    totalEmissions: faker.number.int({ min: 1000, max: 200000 }),
    ghgIntensity: parseFloat(
      faker.number.float({ min: 60, max: 110, fractionDigits: 2 }).toFixed(2)
    ),
    isBaseline: false,
  }));

  await prisma.route.createMany({ data: routes });
  console.log("✅ Inserted 50 Routes");

  const baseline = await prisma.route.findFirst();
  if (baseline) {
    await prisma.route.update({ where: { id: baseline.id }, data: { isBaseline: true } });
    console.log(`✅ Set Route ID ${baseline.id} as baseline`);
  }

  // --- 2️⃣ SHIP COMPLIANCE ---
  const compliances: Omit<ShipCompliance, "id">[] = Array.from({ length: 50 }).map(() => ({
    shipId: faker.string.alphanumeric(5).toUpperCase(),
    year: faker.number.int({ min: 2015, max: 2025 }),
    cbGco2eq: parseFloat(
      faker.number.float({ min: -5000, max: 5000, fractionDigits: 2 }).toFixed(2)
    ),
  }));

  await prisma.shipCompliance.createMany({ data: compliances });
  console.log("✅ Inserted 50 ShipCompliance records");

  // --- 3️⃣ BANK ENTRIES ---
  const bankEntries: Omit<BankEntry, "id">[] = Array.from({ length: 50 }).map(() => ({
    shipId: faker.string.alphanumeric(5).toUpperCase(),
    year: faker.number.int({ min: 2015, max: 2025 }),
    amountGco2eq: parseFloat(
      faker.number.float({ min: -1000, max: 2000, fractionDigits: 2 }).toFixed(2)
    ),
  }));

  await prisma.bankEntry.createMany({ data: bankEntries });
  console.log("✅ Inserted 50 BankEntry records");

  // --- 4️⃣ POOLS ---
  const pools: Omit<Pool, "id" | "members">[] = Array.from({ length: 50 }).map(() => ({
    year: faker.number.int({ min: 2015, max: 2025 }),
    createdAt: faker.date.recent(),
  }));

  const createdPools = await Promise.all(pools.map((p) => prisma.pool.create({ data: p })));
  console.log("✅ Inserted 50 Pools");

  // --- 5️⃣ POOL MEMBERS ---
  const poolMembers: Omit<PoolMember, "id">[] = Array.from({ length: 50 }).map(() => ({
    poolId: faker.helpers.arrayElement(createdPools).id,
    shipId: faker.string.alphanumeric(5).toUpperCase(),
    cbBefore: parseFloat(
      faker.number.float({ min: -2000, max: 2000, fractionDigits: 2 }).toFixed(2)
    ),
    cbAfter: parseFloat(
      faker.number.float({ min: -2000, max: 2000, fractionDigits: 2 }).toFixed(2)
    ),
  }));

  await prisma.poolMember.createMany({ data: poolMembers });
  console.log("✅ Inserted 50 PoolMembers");

  console.log("🌿 Seed complete — all tables populated!");
}

// --- Run safely with proper cleanup ---
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error seeding database:", error);
    await prisma.$disconnect();
    process.exit(1);
  });