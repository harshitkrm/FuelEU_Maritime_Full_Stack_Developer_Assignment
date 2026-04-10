import type { Route } from "../../../core/domain/domain.types.js";
import type { RouteRepositoryPort } from "../../../core/ports/outbound/route-repository.port.js";
import { prisma } from "./prisma-client.js";

function toDomain(row: {
  id: string;
  vesselId: string;
  fuelType: string;
  year: number;
  fuelConsumptionT: { toString(): string };
  actualIntensityGco2ePerMj: { toString(): string };
  isBaseline: boolean;
}): Route {
  return {
    id: row.id,
    vesselId: row.vesselId,
    fuelType: row.fuelType,
    year: row.year,
    fuelConsumptionT: Number(row.fuelConsumptionT),
    actualIntensityGco2ePerMj: Number(row.actualIntensityGco2ePerMj),
    isBaseline: row.isBaseline,
  };
}

export class PrismaRouteRepository implements RouteRepositoryPort {
  async findAll(): Promise<Route[]> {
    const rows = await prisma.route.findMany({
      orderBy: { id: "asc" },
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Route | null> {
    const row = await prisma.route.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  /** Mark one route as baseline and clear others (used by POST /routes/:id/baseline). */
  async setBaseline(routeId: string): Promise<void> {
    await prisma.$transaction([
      prisma.route.updateMany({ data: { isBaseline: false } }),
      prisma.route.update({
        where: { id: routeId },
        data: { isBaseline: true },
      }),
    ]);
  }
}
