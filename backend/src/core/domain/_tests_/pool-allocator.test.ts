import { describe, expect, it } from "vitest";
import { PoolAllocator } from "../pool-allocator.js";

describe("PoolAllocator", () => {
  const allocator = new PoolAllocator();

  it("Rule 1: rejects pool when total CB < 0", () => {
    const r = allocator.allocate([
      { shipId: "a", complianceBalanceGco2e: -100 },
      { shipId: "b", complianceBalanceGco2e: -50 },
    ]);
    expect(r.feasible).toBe(false);
    expect(r.reason).toMatch(/non-negative/);
  });

  it("greedy allocation conserves total CB when feasible", () => {
    const members = [
      { shipId: "A", complianceBalanceGco2e: 80 },
      { shipId: "B", complianceBalanceGco2e: 40 },
      { shipId: "C", complianceBalanceGco2e: -20 },
      { shipId: "D", complianceBalanceGco2e: -30 },
      { shipId: "E", complianceBalanceGco2e: -50 },
    ];
    const total = members.reduce((s, m) => s + m.complianceBalanceGco2e, 0);
    const r = allocator.allocate(members);
    expect(r.feasible).toBe(true);
    let sum = 0;
    for (const m of members) {
      sum += r.finalBalancesByShipId.get(m.shipId)!;
    }
    expect(sum).toBeCloseTo(total, 3);
  });

  it("Rule 2: deficit ships do not exit with a higher deficit", () => {
    const r = allocator.allocate([
      { shipId: "x", complianceBalanceGco2e: -10 },
      { shipId: "y", complianceBalanceGco2e: 25 },
    ]);
    expect(r.feasible).toBe(true);
    expect(r.finalBalancesByShipId.get("x")!).toBeGreaterThanOrEqual(-10);
  });

  it("Rule 3: surplus or zero ships do not exit with a deficit", () => {
    const r = allocator.allocate([
      { shipId: "a", complianceBalanceGco2e: 100 },
      { shipId: "b", complianceBalanceGco2e: -50 },
    ]);
    expect(r.feasible).toBe(true);
    expect(r.finalBalancesByShipId.get("a")!).toBeGreaterThanOrEqual(0);
  });
});
