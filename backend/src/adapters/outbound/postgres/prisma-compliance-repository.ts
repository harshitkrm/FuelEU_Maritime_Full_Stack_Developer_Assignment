import type { ShipCompliance } from "../../../core/domain/domain.types.js";
import type { ComplianceRepositoryPort } from "../../../core/ports/outbound/compliance-repository.port.js";
import { prisma } from "./prisma-client.js";

function toDomain(row: {
  shipId: string;
  year: number;
  complianceBalanceGco2e: { toString(): string };
  verifiedPositiveForBanking: boolean;
  consecutiveNonCompliantYears: number;
  voyagesInScope: number;
}): ShipCompliance {
  return {
    shipId: row.shipId,
    year: row.year,
    complianceBalanceGco2e: Number(row.complianceBalanceGco2e),
    verifiedPositiveForBanking: row.verifiedPositiveForBanking,
    consecutiveNonCompliantYears: row.consecutiveNonCompliantYears,
    voyagesInScope: row.voyagesInScope,
  };
}

export class PrismaComplianceRepository implements ComplianceRepositoryPort {
  async findByShipAndYear(
    shipId: string,
    year: number,
  ): Promise<ShipCompliance | null> {
    const row = await prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });
    return row ? toDomain(row) : null;
  }

  async save(record: ShipCompliance): Promise<void> {
    await prisma.shipCompliance.upsert({
      where: {
        shipId_year: { shipId: record.shipId, year: record.year },
      },
      create: {
        shipId: record.shipId,
        year: record.year,
        complianceBalanceGco2e: record.complianceBalanceGco2e,
        verifiedPositiveForBanking: record.verifiedPositiveForBanking ?? false,
        consecutiveNonCompliantYears: record.consecutiveNonCompliantYears ?? 0,
        voyagesInScope: record.voyagesInScope ?? 0,
      },
      update: {
        complianceBalanceGco2e: record.complianceBalanceGco2e,
        verifiedPositiveForBanking: record.verifiedPositiveForBanking ?? false,
        consecutiveNonCompliantYears: record.consecutiveNonCompliantYears ?? 0,
        voyagesInScope: record.voyagesInScope ?? 0,
      },
    });
  }
}
