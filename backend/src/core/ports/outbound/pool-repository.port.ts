/**
 * Persist a pool and member rows after greedy allocation (final balances).
 */
export interface PoolRepositoryPort {
  savePoolWithMembers(params: {
    reportingYear: number;
    /** Final gCO₂e balance per ship after allocation. */
    finalBalancesByShipId: Map<string, number>;
  }): Promise<{ poolId: string }>;
}
