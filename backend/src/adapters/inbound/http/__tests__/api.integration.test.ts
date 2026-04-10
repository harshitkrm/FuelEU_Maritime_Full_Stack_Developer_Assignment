import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildDefaultHttpApp } from "../create-app.js";
import { prisma } from "../../../outbound/postgres/prisma-client.js";
import { upsertSeedRoutes } from "../../../../test/fixtures/seed-routes.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("HTTP API (integration)", () => {
  const app = buildDefaultHttpApp();

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.bankEntry.deleteMany();
    await prisma.shipCompliance.deleteMany();
    await upsertSeedRoutes(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /routes returns five seed routes", async () => {
    const res = await request(app).get("/routes").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(5);
    expect(res.body.map((r: { id: string }) => r.id).sort()).toEqual([
      "R001",
      "R002",
      "R003",
      "R004",
      "R005",
    ]);
  });

  it("POST /routes/:id/baseline sets baseline and clears others", async () => {
    await request(app).post("/routes/R001/baseline").expect(204);
    const res = await request(app).get("/routes").expect(200);
    const baseline = res.body.filter((r: { isBaseline: boolean }) => r.isBaseline);
    expect(baseline).toHaveLength(1);
    expect(baseline[0].id).toBe("R001");
  });

  it("GET /compliance/cb?routeId= calculates and stores snapshot", async () => {
    const res = await request(app)
      .get("/compliance/cb")
      .query({ routeId: "R003" })
      .expect(200);
    expect(res.body.routeId).toBe("R003");
    expect(res.body.shipId).toBe("V-CHARLIE");
    expect(typeof res.body.complianceBalanceGco2e).toBe("number");
    expect(res.body.verifiedPositiveForBanking).toBe(true);

    const row = await prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId: "V-CHARLIE", year: 2025 } },
    });
    expect(row).not.toBeNull();
    expect(Number(row!.complianceBalanceGco2e)).toBeCloseTo(
      res.body.complianceBalanceGco2e,
      4,
    );
  });

  it("POST /banking/bank records bank entry after surplus snapshot", async () => {
    await request(app).get("/compliance/cb").query({ routeId: "R003" }).expect(200);

    const snap = await prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId: "V-CHARLIE", year: 2025 } },
    });
    const surplus = Number(snap!.complianceBalanceGco2e);
    const amount = Math.min(1000, surplus * 0.5);

    const res = await request(app)
      .post("/banking/bank")
      .send({
        shipId: "V-CHARLIE",
        year: 2025,
        amountGco2e: amount,
      })
      .expect(201);

    expect(res.body.bankedAmountGco2e).toBeCloseTo(amount, 4);
    expect(res.body.cumulativeNetBankedGco2e).toBeCloseTo(amount, 4);

    const entries = await prisma.bankEntry.findMany({
      where: { shipId: "V-CHARLIE", kind: "bank" },
    });
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /pools creates pool and persists final balances", async () => {
    const res = await request(app)
      .post("/pools")
      .send({
        reportingYear: 2025,
        members: [
          { shipId: "S1", complianceBalanceGco2e: 100 },
          { shipId: "S2", complianceBalanceGco2e: -40 },
        ],
      })
      .expect(201);

    expect(res.body.poolId).toBeDefined();
    expect(res.body.feasible).toBe(true);
    expect(res.body.finalBalancesByShipId.S1).toBeDefined();

    const pool = await prisma.pool.findUnique({
      where: { id: res.body.poolId },
      include: { members: true },
    });
    expect(pool).not.toBeNull();
    expect(pool!.members).toHaveLength(2);
  });

  it("GET /compliance/cb without routeId returns 400", async () => {
    const res = await request(app).get("/compliance/cb").expect(400);
    expect(res.body.error).toMatch(/routeId/);
  });
});
