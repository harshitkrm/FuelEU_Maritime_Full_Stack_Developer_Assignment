import type { PoolRepositoryPort } from "../../../core/ports/outbound/pool-repository.port.js";
import { prisma } from "./prisma-client.js";

export class PrismaPoolRepository implements PoolRepositoryPort {
  async savePoolWithMembers(params: {
    reportingYear: number;
    finalBalancesByShipId: Map<string, number>;
  }): Promise<{ poolId: string }> {
    const pool = await prisma.pool.create({
      data: {
        reportingYear: params.reportingYear,
        members: {
          create: [...params.finalBalancesByShipId.entries()].map(
            ([shipId, complianceBalanceGco2e]) => ({
              shipId,
              complianceBalanceGco2e,
            }),
          ),
        },
      },
    });
    return { poolId: pool.id };
  }
}
