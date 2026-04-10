import { ApplicationError } from "./errors.js";
import type { BankEntryRepositoryPort } from "../ports/outbound/bank-entry-repository.port.js";
import type { ComplianceRepositoryPort } from "../ports/outbound/compliance-repository.port.js";

export interface BankSurplusInput {
  shipId: string;
  year: number;
  amountGco2e: number;
}

export interface BankSurplusResult {
  bankedAmountGco2e: number;
  cumulativeNetBankedGco2e: number;
}

/**
 * Article 20 — register surplus in the bank ledger (verified CB must be positive).
 */
export class BankSurplusUseCase {
  constructor(
    private readonly compliance: ComplianceRepositoryPort,
    private readonly bankEntries: BankEntryRepositoryPort,
  ) {}

  async execute(input: BankSurplusInput): Promise<BankSurplusResult> {
    if (input.amountGco2e <= 0) {
      throw new ApplicationError("amountGco2e must be positive", 400);
    }

    const rec = await this.compliance.findByShipAndYear(input.shipId, input.year);
    if (!rec) {
      throw new ApplicationError(
        "No compliance snapshot for this ship and year — run GET /compliance/cb first",
        400,
      );
    }
    if (!rec.verifiedPositiveForBanking || rec.complianceBalanceGco2e <= 0) {
      throw new ApplicationError(
        "Banking only allowed when verified compliance balance is a surplus (CB > 0)",
        400,
      );
    }
    if (input.amountGco2e > rec.complianceBalanceGco2e) {
      throw new ApplicationError(
        "amountGco2e cannot exceed the stored compliance surplus for that year",
        400,
      );
    }

    await this.bankEntries.append({
      shipId: input.shipId,
      year: input.year,
      amountGco2e: input.amountGco2e,
      kind: "bank",
    });

    const cumulativeNetBankedGco2e =
      await this.bankEntries.cumulativeNetBankedGco2e(input.shipId);

    return {
      bankedAmountGco2e: input.amountGco2e,
      cumulativeNetBankedGco2e,
    };
  }
}
