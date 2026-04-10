import express, { type Express } from "express";
import {
  BankSurplusUseCase,
  CalculateComplianceBalanceUseCase,
  CreatePoolUseCase,
  GetRoutesUseCase,
  SetBaselineUseCase,
} from "../../../core/application/index.js";
import { ApplicationError } from "../../../core/application/errors.js";
import { ComplianceCalculator } from "../../../core/domain/compliance-calculator.js";
import { PoolAllocator } from "../../../core/domain/pool-allocator.js";
import {
  PrismaBankEntryRepository,
  PrismaComplianceRepository,
  PrismaPoolRepository,
  PrismaRouteRepository,
} from "../../outbound/postgres/index.js";

export interface HttpAppDeps {
  getRoutes: GetRoutesUseCase;
  setBaseline: SetBaselineUseCase;
  calculateComplianceBalance: CalculateComplianceBalanceUseCase;
  bankSurplus: BankSurplusUseCase;
  createPool: CreatePoolUseCase;
}

export function createHttpApp(deps: HttpAppDeps): Express {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,OPTIONS,PUT,PATCH,DELETE",
    );
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/routes", async (_req, res, next) => {
    try {
      const routes = await deps.getRoutes.execute();
      res.json(routes);
    } catch (e) {
      next(e);
    }
  });

  app.post("/routes/:id/baseline", async (req, res, next) => {
    try {
      await deps.setBaseline.execute(req.params.id ?? "");
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  app.get("/compliance/cb", async (req, res, next) => {
    try {
      const routeId = req.query.routeId;
      if (typeof routeId !== "string" || !routeId) {
        throw new ApplicationError("Query parameter routeId is required", 400);
      }
      const snapshot = await deps.calculateComplianceBalance.execute(routeId);
      res.json(snapshot);
    } catch (e) {
      next(e);
    }
  });

  app.post("/banking/bank", async (req, res, next) => {
    try {
      const body = req.body as {
        shipId?: unknown;
        year?: unknown;
        amountGco2e?: unknown;
      };
      if (typeof body.shipId !== "string" || typeof body.year !== "number") {
        throw new ApplicationError("shipId (string) and year (number) are required", 400);
      }
      if (typeof body.amountGco2e !== "number") {
        throw new ApplicationError("amountGco2e (number) is required", 400);
      }
      const result = await deps.bankSurplus.execute({
        shipId: body.shipId,
        year: body.year,
        amountGco2e: body.amountGco2e,
      });
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  app.post("/pools", async (req, res, next) => {
    try {
      const body = req.body as {
        reportingYear?: unknown;
        members?: unknown;
      };
      if (typeof body.reportingYear !== "number") {
        throw new ApplicationError("reportingYear (number) is required", 400);
      }
      if (!Array.isArray(body.members)) {
        throw new ApplicationError(
          "members (array of { shipId, complianceBalanceGco2e }) is required",
          400,
        );
      }
      const members = body.members.map((m: unknown) => {
        const row = m as { shipId?: unknown; complianceBalanceGco2e?: unknown };
        if (typeof row.shipId !== "string" || typeof row.complianceBalanceGco2e !== "number") {
          throw new ApplicationError(
            "Each member must have shipId (string) and complianceBalanceGco2e (number)",
            400,
          );
        }
        return {
          shipId: row.shipId,
          complianceBalanceGco2e: row.complianceBalanceGco2e,
        };
      });
      const result = await deps.createPool.execute({
        reportingYear: body.reportingYear,
        members,
      });
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof ApplicationError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}

export function buildDefaultHttpApp(): Express {
  const routeRepo = new PrismaRouteRepository();
  const complianceRepo = new PrismaComplianceRepository();
  const poolRepo = new PrismaPoolRepository();
  const bankRepo = new PrismaBankEntryRepository();
  const calculator = new ComplianceCalculator();
  const allocator = new PoolAllocator();

  return createHttpApp({
    getRoutes: new GetRoutesUseCase(routeRepo),
    setBaseline: new SetBaselineUseCase(routeRepo),
    calculateComplianceBalance: new CalculateComplianceBalanceUseCase(
      routeRepo,
      complianceRepo,
      calculator,
    ),
    bankSurplus: new BankSurplusUseCase(complianceRepo, bankRepo),
    createPool: new CreatePoolUseCase(poolRepo, allocator),
  });
}
