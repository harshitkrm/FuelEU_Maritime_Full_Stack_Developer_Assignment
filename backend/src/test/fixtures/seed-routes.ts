import type { PrismaClient } from "@prisma/client";

/** Shared R001–R005 seed rows for `prisma/seed.ts` and integration tests. */
export const SEED_ROUTES = [
  {
    id: "R001",
    vesselId: "V-ALPHA",
    fuelType: "MGO",
    year: 2025,
    fuelConsumptionT: 120.5,
    actualIntensityGco2ePerMj: 92.4,
    isBaseline: false,
  },
  {
    id: "R002",
    vesselId: "V-BRAVO",
    fuelType: "VLSFO",
    year: 2025,
    fuelConsumptionT: 200.0,
    actualIntensityGco2ePerMj: 88.1,
    isBaseline: true,
  },
  {
    id: "R003",
    vesselId: "V-CHARLIE",
    fuelType: "LNG",
    year: 2025,
    fuelConsumptionT: 80.25,
    actualIntensityGco2ePerMj: 74.8,
    isBaseline: false,
  },
  {
    id: "R004",
    vesselId: "V-DELTA",
    fuelType: "HFO",
    year: 2025,
    fuelConsumptionT: 300.0,
    actualIntensityGco2ePerMj: 95.0,
    isBaseline: false,
  },
  {
    id: "R005",
    vesselId: "V-ECHO",
    fuelType: "MGO",
    year: 2024,
    fuelConsumptionT: 90.0,
    actualIntensityGco2ePerMj: 91.2,
    isBaseline: false,
  },
] as const;

export async function upsertSeedRoutes(prisma: PrismaClient): Promise<void> {
  for (const r of SEED_ROUTES) {
    await prisma.route.upsert({
      where: { id: r.id },
      create: { ...r },
      update: {
        vesselId: r.vesselId,
        fuelType: r.fuelType,
        year: r.year,
        fuelConsumptionT: r.fuelConsumptionT,
        actualIntensityGco2ePerMj: r.actualIntensityGco2ePerMj,
        isBaseline: r.isBaseline,
      },
    });
  }
}
