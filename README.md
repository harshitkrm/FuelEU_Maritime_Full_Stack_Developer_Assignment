# FuelEU Maritime Compliance Platform

Monorepo layout for submission: **`backend/`** (Express + Prisma API), **`frontend/`** (Vite + React SPA). Assignment docs live at the **repository root**: `AGENT_WORKFLOW.md`, `README.md`, `REFLECTION.md`.

The backend follows **Hexagonal Architecture** (ports & adapters): domain and application logic stay independent of Express and Prisma; the SPA talks only to HTTP endpoints.

## Repository layout

```
.
├── AGENT_WORKFLOW.md
├── README.md
├── REFLECTION.md
├── package.json          # npm workspaces + scripts delegating to backend/frontend
├── backend/
│   ├── package.json
│   ├── prisma/
│   ├── src/              # domain, application, adapters, server.ts
│   └── .env.example
└── frontend/
    ├── package.json
    └── src/
```

## Architecture

```mermaid
flowchart LR
  subgraph frontend [frontend / SPA]
    UI[adapters/ui]
    INF[adapters/infrastructure API client]
    UI --> INF
  end

  subgraph backend [backend / Node]
    HTTP[adapters/inbound/http Express]
    APP[core/application use-cases]
    DOM[core/domain calculators]
    PORTS[core/ports]
    PG[adapters/outbound/postgres Prisma]
    HTTP --> APP
    APP --> DOM
    APP --> PORTS
    PG -.implements.-> PORTS
  end

  INF -->|HTTP JSON| HTTP
```

- **Domain** (`backend/src/core/domain`): `ComplianceCalculator`, `PoolAllocator`, shared types — no framework imports.
- **Application** (`backend/src/core/application`): use-cases orchestrate domain + ports.
- **Ports** (`backend/src/core/ports`): repository interfaces.
- **Inbound HTTP** (`backend/src/adapters/inbound/http`): Express app factory.
- **Outbound Postgres** (`backend/src/adapters/outbound/postgres`): Prisma repositories.
- **Frontend** (`frontend/src`): UI under `adapters/ui`, HTTP client under `adapters/infrastructure`.

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** for the API

## Install (once, from repository root)

```bash
npm install
```

This installs **npm workspaces** for `backend` and `frontend` (dependencies may hoist to the root `node_modules`).

## Backend (`backend/`)

1. **Environment**

   Copy `backend/.env.example` → **`backend/.env`** and set a real connection string:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fueleu?schema=public"
   PORT=3001
   ```

2. **Migrate and seed** (from repository root, or `cd backend` first):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Equivalent: `cd backend && npx prisma migrate deploy && npx prisma db seed`

3. **Run the API** (default port **3001**)

   From **repository root**:

   ```bash
   npm run dev
   ```

   Or: `npm run start` (no watch).  
   Or from `backend/`: `npm run dev` / `npm start`.

### Backend workspace scripts

| Command (from repo root) | Purpose |
|---------------------------|---------|
| `npm run dev` | API with watch (`tsx watch`) |
| `npm run start` | API without watch |
| `npm run build` | `npm run build -w fueleu-backend` — `tsc` |
| `npm run lint` | Lint backend + frontend |
| `npm test` | Tests backend + frontend |
| `npm run db:generate` | Prisma generate |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Seed routes |
| `npm run db:studio` | Prisma Studio |

**Integration tests** (`backend/src/adapters/inbound/http/__tests__/api.integration.test.ts`) need `DATABASE_URL` in `backend/.env` and a migrated DB; otherwise skipped.

## Frontend (`frontend/`)

With the API on **3001**, Vite proxies **`/api` → `http://localhost:3001`** (`frontend/vite.config.ts`).

From **repository root**:

```bash
npm run dev -w fueleu-web
```

Or:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** (or the URL Vite prints).

Optional: copy `frontend/.env.example` → `frontend/.env` and set `VITE_API_URL` if not using the dev proxy.

### Frontend scripts

| Command | Purpose |
|---------|---------|
| `npm run build -w fueleu-web` | Production build → `frontend/dist` |
| `npm run lint -w fueleu-web` | ESLint |
| `npm run test -w fueleu-web` | Vitest |

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/routes` | List routes |
| `POST` | `/routes/:id/baseline` | Set baseline |
| `GET` | `/compliance/cb?routeId=` | CB snapshot |
| `POST` | `/banking/bank` | Article 20 bank |
| `POST` | `/pools` | Article 21 pool |

## Quality gates (from repository root)

```bash
npm run lint
npm test
```

Both should exit with code **0**.

## License

Private / educational use unless otherwise specified.
