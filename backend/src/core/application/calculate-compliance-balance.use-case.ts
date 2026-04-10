import {
  ComplianceCalculator,
  FUELEU_DEFAULT_TARGET_INTENSITY_GCO2E_PER_MJ,
  FUELEU_LCV_MJ_PER_T,
} from "../domain/compliance-calculator.js";
import { ApplicationError } from "./errors.js";
import type { ComplianceRepositoryPort } from "../ports/outbound/compliance-repository.port.js";
import type { RouteRepositoryPort } from "../ports/outbound/route-repository.port.js";

export interface ComplianceBalanceSnapshot {
  routeId: string;
  shipId: string;
  year: number;
  fuelConsumptionT: number;
  actualIntensityGco2ePerMj: number;
  targetIntensityGco2ePerMj: number;
  energyInScopeMj: number;
  complianceBalanceGco2e: number;
  verifiedPositiveForBanking: boolean;
}

export class CalculateComplianceBalanceUseCase {
  constructor(
    private readonly routes: RouteRepositoryPort,
    private readonly compliance: ComplianceRepositoryPort,
    private readonly calculator: ComplianceCalculator,
  ) {}

  /**
   * Loads a route by id, computes CB, persists `ship_compliance` for that vessel/year.
   */
  async execute(routeId: string): Promise<ComplianceBalanceSnapshot> {
    const route = await this.routes.findById(routeId);
    if (!route) {
      throw new ApplicationError("Route not found", 404);
    }

    const complianceBalanceGco2e = this.calculator.calculateCB({
      fuelConsumptionT: route.fuelConsumptionT,
      actualIntensityGco2ePerMj: route.actualIntensityGco2ePerMj,
    });

    const energyInScopeMj = route.fuelConsumptionT * FUELEU_LCV_MJ_PER_T;
    const verifiedPositiveForBanking = complianceBalanceGco2e > 0;

    const prior = await this.compliance.findByShipAndYear(
      route.vesselId,
      route.year,
    );

    const consecutiveNonCompliantYears =
      complianceBalanceGco2e < 0
        ? (prior?.consecutiveNonCompliantYears ?? 0) + 1
        : 0;

    await this.compliance.save({
      shipId: route.vesselId,
      year: route.year,
      complianceBalanceGco2e,
      verifiedPositiveForBanking,
      consecutiveNonCompliantYears,
      voyagesInScope: prior?.voyagesInScope ?? 1,
    });

    return {
      routeId: route.id,
      shipId: route.vesselId,
      year: route.year,
      fuelConsumptionT: route.fuelConsumptionT,
      actualIntensityGco2ePerMj: route.actualIntensityGco2ePerMj,
      targetIntensityGco2ePerMj: FUELEU_DEFAULT_TARGET_INTENSITY_GCO2E_PER_MJ,
      energyInScopeMj,
      complianceBalanceGco2e,
      verifiedPositiveForBanking,
    };
  }
}
