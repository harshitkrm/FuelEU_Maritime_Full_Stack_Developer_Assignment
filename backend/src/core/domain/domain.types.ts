/**
 * Pure domain contracts — no framework or infrastructure imports.
 */

export interface Route {
  id: string;
  vesselId: string;
  fuelType: string;
  year: number;
  /** Metric tonnes of fuel consumed (in scope). */
  fuelConsumptionT: number;
  /** Well-to-wake intensity (gCO₂e/MJ). */
  actualIntensityGco2ePerMj: number;
  /** Comparison baseline for dashboard “Compare” tab. */
  isBaseline: boolean;
}

export interface ShipCompliance {
  shipId: string;
  year: number;
  /** Compliance balance (gCO₂e). */
  complianceBalanceGco2e: number;
  verifiedPositiveForBanking?: boolean;
  consecutiveNonCompliantYears?: number;
  voyagesInScope?: number;
}

export interface BankEntry {
  shipId: string;
  year: number;
  amountGco2e: number;
  kind: "bank" | "apply";
}

export interface Pool {
  id: string;
  reportingYear: number;
  memberShipIds: string[];
}

export interface PoolMember {
  shipId: string;
  complianceBalanceGco2e: number;
}
