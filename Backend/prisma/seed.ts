// prisma/seed.ts
import "../src/config/env.js";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();
  console.log("✅ Cleared existing data");

  // Vessel types and fuel types for realistic data
  const vesselTypes = ["Container", "BulkCarrier", "Tanker", "RoRo", "GeneralCargo", "Passenger"];
  const fuelTypes = ["HFO", "LNG", "MGO", "LSFO", "Biofuel"];
  const years = [2024, 2025, 2026];

  // Generate 50 routes
  const routes = [];
  
  for (let i = 1; i <= 50; i++) {
    const vesselType = faker.helpers.arrayElement(vesselTypes);
    const fuelType = faker.helpers.arrayElement(fuelTypes);
    const year = faker.helpers.arrayElement(years);
    
    // Generate realistic values
    const fuelConsumption = faker.number.int({ min: 3000, max: 8000 }); // tons
    const distance = faker.number.int({ min: 8000, max: 20000 }); // km
    
    // GHG intensity varies by fuel type (realistic ranges)
    let ghgIntensity: number;
    switch (fuelType) {
      case "LNG":
        ghgIntensity = faker.number.float({ min: 85.0, max: 92.0, fractionDigits: 1 });
        break;
      case "MGO":
        ghgIntensity = faker.number.float({ min: 90.0, max: 95.0, fractionDigits: 1 });
        break;
      case "LSFO":
        ghgIntensity = faker.number.float({ min: 88.0, max: 93.0, fractionDigits: 1 });
        break;
      case "Biofuel":
        ghgIntensity = faker.number.float({ min: 75.0, max: 85.0, fractionDigits: 1 });
        break;
      default: // HFO
        ghgIntensity = faker.number.float({ min: 90.0, max: 95.0, fractionDigits: 1 });
    }
    
    // Calculate total emissions (simplified: fuelConsumption * emissions factor)
    // Using approximate factor of 0.9-1.0 tCO2 per ton of fuel
    const emissionsFactor = faker.number.float({ min: 0.85, max: 1.0, fractionDigits: 2 });
    const totalEmissions = Math.round(fuelConsumption * emissionsFactor);
    
    routes.push({
      routeId: `R${String(i).padStart(3, "0")}`,
      vesselType,
      fuelType,
      year,
      ghgIntensity,
      fuelConsumption,
      distance,
      totalEmissions,
      isBaseline: i === 1, // Set first route as baseline
    });
  }

  await prisma.route.createMany({ data: routes });
  console.log(`✅ Inserted ${routes.length} Routes (R001-R${String(routes.length).padStart(3, "0")})`);

  console.log("🌿 Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error seeding database:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
