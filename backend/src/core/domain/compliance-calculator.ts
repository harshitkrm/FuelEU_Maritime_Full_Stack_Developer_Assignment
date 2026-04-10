/**
 * Regulation (EU) 2023/1805 — compliance balance and monetary penalties.
 * Pure TypeScript; no external dependencies.
 */
export const FUELEU_LCV_MJ_PER_T = 41_000;
export const FUELEU_DEFAULT_TARGET_INTENSITY_GCO2E_PER_MJ = 89.3368;

export class ComplianceCalculator {
  private static readonly PENALTY_EUR_PER_TONNE_VLSFO = 2_400;
  private static readonly CONSECUTIVE_STEP = 0.1;

  /**
   * CB (gCO₂e) = (Target − Actual) × (FuelConsumption × 41,000 MJ).
   */
  calculateCB(params: {
    fuelConsumptionT: number;
    actualIntensityGco2ePerMj: number;
    /** Defaults to 89.3368 gCO₂e/MJ when omitted. */
    targetIntensityGco2ePerMj?: number;
  }): number {
    const target =
      params.targetIntensityGco2ePerMj ??
      FUELEU_DEFAULT_TARGET_INTENSITY_GCO2E_PER_MJ;
    const energyMj = params.fuelConsumptionT * FUELEU_LCV_MJ_PER_T;
    return (target - params.actualIntensityGco2ePerMj) * energyMj;
  }

  /** Standard penalty: €2,400 per metric tonne of VLSFO-equivalent deficit. */
  calculatePenalty(vlsfoTonneEquivalent: number): number {
    if (vlsfoTonneEquivalent < 0) {
      throw new Error("VLSFO-equivalent tonnes must be non-negative.");
    }
    return vlsfoTonneEquivalent * ComplianceCalculator.PENALTY_EUR_PER_TONNE_VLSFO;
  }

  /**
   * Consecutive non-compliance: Penalty × (1 + (n − 1) × 0.10), n ≥ 1.
   */
  calculateConsecutivePenalty(basePenaltyEur: number, consecutiveYearsN: number): number {
    const n = consecutiveYearsN;
    if (n < 1) {
      throw new Error("Consecutive years n must be at least 1.");
    }
    if (basePenaltyEur < 0) {
      throw new Error("Base penalty must be non-negative.");
    }
    return basePenaltyEur * (1 + (n - 1) * ComplianceCalculator.CONSECUTIVE_STEP);
  }
}
