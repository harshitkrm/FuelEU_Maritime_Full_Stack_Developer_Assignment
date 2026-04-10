/**
 * Outbound HTTP adapter — talks to the FuelEU Express API (hexagonal “driving” side for the UI).
 * Base URL: `VITE_API_URL` or `/api` (Vite dev proxy → backend).
 */

const raw =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const API_BASE = raw || "/api";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = (await res.json()) as { error?: string };
      if (err?.error) detail = err.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return parseJson<T>(res);
}

export type RouteDto = {
  id: string;
  vesselId: string;
  fuelType: string;
  year: number;
  fuelConsumptionT: number;
  actualIntensityGco2ePerMj: number;
  isBaseline: boolean;
};

export type ComplianceSnapshotDto = {
  routeId: string;
  shipId: string;
  year: number;
  fuelConsumptionT: number;
  actualIntensityGco2ePerMj: number;
  targetIntensityGco2ePerMj: number;
  energyInScopeMj: number;
  complianceBalanceGco2e: number;
  verifiedPositiveForBanking: boolean;
};

export type BankResultDto = {
  bankedAmountGco2e: number;
  cumulativeNetBankedGco2e: number;
};

export type PoolResultDto = {
  poolId: string;
  feasible: boolean;
  finalBalancesByShipId: Record<string, number>;
};

export const api = {
  getRoutes: () => request<RouteDto[]>("/routes"),

  setBaseline: (routeId: string) =>
    request<void>(`/routes/${encodeURIComponent(routeId)}/baseline`, {
      method: "POST",
    }),

  getComplianceCb: (routeId: string) => {
    const q = new URLSearchParams({ routeId });
    return request<ComplianceSnapshotDto>(`/compliance/cb?${q.toString()}`);
  },

  postBank: (body: {
    shipId: string;
    year: number;
    amountGco2e: number;
  }) =>
    request<BankResultDto>("/banking/bank", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  postPool: (body: {
    reportingYear: number;
    members: { shipId: string; complianceBalanceGco2e: number }[];
  }) =>
    request<PoolResultDto>("/pools", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
