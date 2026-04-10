# Agent workflow — FuelEU Maritime Compliance Platform

This log summarizes how the project was built through phased prompts, what was corrected when specifications were ambiguous or easy to mis-implement, and how hexagonal boundaries were kept explicit.

**Repository layout (submission):** `backend/` (API + Prisma + domain), `frontend/` (Vite React), and the three markdown deliverables at the **repository root**. The root `package.json` uses **npm workspaces** so `npm install`, `npm run dev`, and `npm test` can be run from the root.

## Phase 1 — Core domain & regulatory math

**Prompts used:** Define domain entities; implement `ComplianceCalculator` (CB, penalty, consecutive penalty); `PoolAllocator` (Article 21 greedy rules); unit tests under `backend/src/core/domain/_tests_`.

**Steps taken:**

- Introduced pure TypeScript interfaces (`Route`, `ShipCompliance`, `BankEntry`, `Pool`, `PoolMember`) and classes `ComplianceCalculator` and `PoolAllocator` with **no runtime npm dependencies** in the domain layer.
- Implemented **CB** as  
  \(\text{CB} = (\text{Target} - \text{Actual}) \times (\text{FuelConsumption} \times 41{,}000)\)  
  with default target **89.3368** gCO₂e/MJ and LCV **41,000** MJ/t.
- Implemented **standard penalty** €2,400 per tonne VLSFO-equivalent and **consecutive multiplier**  
  \(\text{Total} = \text{Penalty} \times (1 + (n-1) \times 0.10)\).

**Corrections / clarifications (formulas & logic):**

1. **Consecutive penalty (10% step)**  
   Early drafts mixed “increment per year” with “compound on total.” The assignment formula is explicit: multiply the **base** penalty by \((1 + (n-1) \times 0.10)\). Unit tests lock this to \(n=1 \Rightarrow 1.0\), \(n=2 \Rightarrow 1.1\), \(n=3 \Rightarrow 1.2\).

2. **VLSFO tonne deficit (when CB &lt; 0)**  
   The text “energy deficit ÷ (Actual × 41,000)” was aligned with **gCO₂e deficit** \(|CB|\) in the numerator so dimensions match **gCO₂e per tonne fuel** in the denominator. This was documented in code comments and kept consistent with the calculator tests.

3. **Pool greedy allocation & conservation**  
   A first implementation did not conserve total CB when moving surplus to deficits. It was **replaced** with: aggregate positive CB, cover deficits in descending-CB order, distribute **remainder** back to surplus ships **proportionally**, then validate “no worse off” and “surplus protection.” Unit tests assert sum in = sum out for a standard scenario.

**Hexagonal validation:**

- Domain files import only other domain modules (types, calculators).
- No imports from Express, Prisma, React, or `fetch` inside `backend/src/core/domain`.

## Phase 2 — Database & Prisma

**Prompts used:** `backend/prisma/schema.prisma` for `routes`, `ship_compliance`, `bank_entries`, `pools`, `pool_members`; outbound adapters under `backend/src/adapters/outbound/postgres`; seed R001–R005 with one baseline; `DATABASE_URL`.

**Steps taken:**

- Mapped snake_case columns to Prisma models; added `is_baseline` on routes.
- Implemented `PrismaRouteRepository` and `PrismaComplianceRepository` against port interfaces.
- Centralized seed data in `backend/src/test/fixtures/seed-routes.ts` for reuse by `backend/prisma/seed.ts` and tests.
- Added initial SQL migration under `backend/prisma/migrations/`.

**Hexagonal validation:** Repositories implement **ports** only; Prisma types stay inside `adapters/outbound/postgres`.

## Phase 3 — Application & API

**Prompts used:** Use-cases (`GetRoutes`, `SetBaseline`, compliance snapshot, `BankSurplus`, `CreatePool`); Express controllers; endpoints listed in the assignment; supertest integration tests.

**Steps taken:**

- Wired use-cases to domain + ports; added `PrismaPoolRepository` and `PrismaBankEntryRepository` where needed.
- Exposed REST API and added **CORS** for the later SPA.
- Integration tests in `backend/src/adapters/inbound/http/__tests__/`; **skipped** when `DATABASE_URL` is unset so CI/local runs without Postgres still pass unit tests.

**Hexagonal validation:** HTTP handlers only call use-case methods; use-cases do not import Express.

## Phase 4 — Frontend

**Prompts used:** React + Vite + Tailwind + TanStack Query + recharts; tabs Routes / Compare / Banking / Pooling; `frontend/src/adapters/ui` and `frontend/src/adapters/infrastructure` (API client).

**Steps taken:**

- `frontend/` is a separate workspace package (`fueleu-web`).
- API client wraps `fetch` with a base URL (`VITE_API_URL` or dev proxy `/api`).
- Four tabs implemented per spec (baseline mutation, compare chart vs target, banking KPIs, pooling sum indicator).

**Hexagonal validation:** UI components depend on the **api adapter** and React Query, not on backend internals.

## Phase 5 — Documentation & polish

**Prompts used:** `AGENT_WORKFLOW.md`, `README.md`, `REFLECTION.md`; `npm run lint` and `npm run test` for backend and frontend.

**Steps taken:**

- ESLint 9 flat config in `backend/` and `frontend/`.
- Frontend smoke test with Vitest; backend retains domain + optional integration tests.
- Monorepo: root workspace `package.json` runs `npm test` and `npm run lint` across **fueleu-backend** and **fueleu-web**.

## Verification checklist

| Check | How |
|--------|-----|
| Domain purity | No framework imports under `backend/src/core/domain` |
| Ports/adapters | Repositories implement `backend/src/core/ports`; HTTP in `adapters/inbound` |
| API contract | Frontend `api-client` matches Express routes |
| Tests | `npm test` from **repository root** (both workspaces) |
| Lint | `npm run lint` from **repository root** |
| Submission layout | `backend/`, `frontend/`, three `.md` files at root |

---

*End of agent workflow log.*
