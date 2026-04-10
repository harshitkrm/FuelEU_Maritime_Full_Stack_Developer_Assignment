import type { PoolMember } from "./domain.types.js";

export interface PoolAllocationResult {
  finalBalancesByShipId: Map<string, number>;
  feasible: boolean;
  reason?: string;
}

function sumCb(members: PoolMember[]): number {
  return members.reduce((s, m) => s + m.complianceBalanceGco2e, 0);
}

function splitProportional(
  contributors: { shipId: string; weight: number }[],
  amount: number,
): Map<string, number> {
  const out = new Map<string, number>();
  const totalW = contributors.reduce((s, c) => s + c.weight, 0);
  if (totalW <= 0 || amount <= 0) {
    for (const c of contributors) out.set(c.shipId, 0);
    return out;
  }
  let allocated = 0;
  for (let i = 0; i < contributors.length; i++) {
    const c = contributors[i]!;
    const share =
      i === contributors.length - 1
        ? amount - allocated
        : (amount * c.weight) / totalW;
    const rounded =
      i === contributors.length - 1 ? share : Math.round(share * 1e9) / 1e9;
    allocated += rounded;
    out.set(c.shipId, rounded);
  }
  return out;
}

/**
 * Article 21 — greedy pooling after sorting by CB descending.
 */
export class PoolAllocator {
  allocate(members: PoolMember[]): PoolAllocationResult {
    if (members.length === 0) {
      return { finalBalancesByShipId: new Map(), feasible: true };
    }

    if (sumCb(members) < 0) {
      return {
        finalBalancesByShipId: new Map(),
        feasible: false,
        reason: "Sum of pool compliance balances must be non-negative.",
      };
    }

    const sorted = [...members].sort(
      (a, b) => b.complianceBalanceGco2e - a.complianceBalanceGco2e,
    );

    const positives: { shipId: string; cb: number }[] = [];
    const negatives: { shipId: string; cb: number }[] = [];
    for (const m of sorted) {
      if (m.complianceBalanceGco2e > 0) {
        positives.push({ shipId: m.shipId, cb: m.complianceBalanceGco2e });
      } else if (m.complianceBalanceGco2e < 0) {
        negatives.push({ shipId: m.shipId, cb: m.complianceBalanceGco2e });
      }
    }

    let pool = positives.reduce((s, p) => s + p.cb, 0);
    const finalBalances = new Map<string, number>();

    for (const n of negatives) {
      const need = -n.cb;
      const use = Math.min(pool, need);
      pool -= use;
      const remainingDeficit = need - use;
      finalBalances.set(n.shipId, -remainingDeficit);
    }

    const remainder = pool;
    const contrib = positives.map((p) => ({
      shipId: p.shipId,
      weight: p.cb,
    }));
    const positiveShares = splitProportional(contrib, remainder);
    for (const p of positives) {
      finalBalances.set(p.shipId, positiveShares.get(p.shipId)!);
    }

    for (const m of members) {
      if (m.complianceBalanceGco2e === 0) {
        finalBalances.set(m.shipId, 0);
      }
    }

    for (const m of members) {
      const initial = m.complianceBalanceGco2e;
      const fin = finalBalances.get(m.shipId)!;
      if (initial < 0 && fin < initial) {
        return {
          finalBalancesByShipId: new Map(),
          feasible: false,
          reason:
            "No worse off: a deficit ship cannot exit with an increased deficit.",
        };
      }
      if (initial >= 0 && fin < 0) {
        return {
          finalBalancesByShipId: new Map(),
          feasible: false,
          reason:
            "Surplus protection: a non-deficit ship cannot exit with a deficit.",
        };
      }
    }

    return { finalBalancesByShipId: finalBalances, feasible: true };
  }
}
