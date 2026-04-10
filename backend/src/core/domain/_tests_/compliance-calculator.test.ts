import { describe, expect, it } from "vitest";
import { ComplianceCalculator } from "../compliance-calculator.js";

const TARGET = 89.3368;
const LCV = 41_000;

describe("ComplianceCalculator", () => {
  const calc = new ComplianceCalculator();

  describe("calculateCB", () => {
    it("computes CB = (Target − Actual) × (FuelConsumption × 41,000)", () => {
      const fuelConsumptionT = 2;
      const actual = 90;
      const energyMj = fuelConsumptionT * LCV;
      const cb = calc.calculateCB({
        fuelConsumptionT,
        actualIntensityGco2ePerMj: actual,
      });
      expect(cb).toBeCloseTo((TARGET - actual) * energyMj, 6);
    });

    it("uses default target 89.3368 when not provided", () => {
      const cb = calc.calculateCB({
        fuelConsumptionT: 1,
        actualIntensityGco2ePerMj: TARGET,
      });
      expect(cb).toBe(0);
    });
  });

  describe("calculatePenalty", () => {
    it("applies €2,400 per tonne VLSFO-equivalent", () => {
      expect(calc.calculatePenalty(1)).toBe(2400);
      expect(calc.calculatePenalty(2.5)).toBe(6000);
    });
  });

  describe("calculateConsecutivePenalty", () => {
    it("applies Penalty × (1 + (n − 1) × 0.10)", () => {
      const base = 2400;
      expect(calc.calculateConsecutivePenalty(base, 1)).toBe(2400);
      expect(calc.calculateConsecutivePenalty(base, 2)).toBeCloseTo(2400 * 1.1, 6);
      expect(calc.calculateConsecutivePenalty(base, 3)).toBeCloseTo(2400 * 1.2, 6);
    });
  });
});
