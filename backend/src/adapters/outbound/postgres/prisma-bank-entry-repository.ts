import type { BankEntryRepositoryPort } from "../../../core/ports/outbound/bank-entry-repository.port.js";
import { prisma } from "./prisma-client.js";

export class PrismaBankEntryRepository implements BankEntryRepositoryPort {
  async append(params: {
    shipId: string;
    year: number;
    amountGco2e: number;
    kind: "bank" | "apply";
  }): Promise<void> {
    await prisma.bankEntry.create({
      data: {
        shipId: params.shipId,
        year: params.year,
        amountGco2e: params.amountGco2e,
        kind: params.kind,
      },
    });
  }

  async cumulativeNetBankedGco2e(shipId: string): Promise<number> {
    const [banked, applied] = await Promise.all([
      prisma.bankEntry.aggregate({
        where: { shipId, kind: "bank" },
        _sum: { amountGco2e: true },
      }),
      prisma.bankEntry.aggregate({
        where: { shipId, kind: "apply" },
        _sum: { amountGco2e: true },
      }),
    ]);
    const b = Number(banked._sum.amountGco2e ?? 0);
    const a = Number(applied._sum.amountGco2e ?? 0);
    return b - a;
  }
}
