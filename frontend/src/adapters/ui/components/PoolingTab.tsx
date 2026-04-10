import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import {
  api,
  type ComplianceSnapshotDto,
} from "../../infrastructure/api-client.js";

export function PoolingTab() {
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => api.getRoutes(),
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const idList = useMemo(() => [...selectedIds], [selectedIds]);

  const complianceQueries = useQueries({
    queries: idList.map((routeId) => ({
      queryKey: ["compliance", routeId],
      queryFn: () => api.getComplianceCb(routeId),
      enabled: selectedIds.size > 0,
    })),
  });

  const snapByRouteId = useMemo(() => {
    const m = new Map<string, ComplianceSnapshotDto>();
    idList.forEach((routeId, i) => {
      const q = complianceQueries[i];
      if (q?.data) m.set(routeId, q.data);
    });
    return m;
  }, [idList, complianceQueries]);

  const members = useMemo(() => {
    const out: { shipId: string; complianceBalanceGco2e: number }[] = [];
    for (const routeId of idList) {
      const route = routes?.find((r) => r.id === routeId);
      const snap = snapByRouteId.get(routeId);
      if (!route || !snap) continue;
      out.push({
        shipId: route.vesselId,
        complianceBalanceGco2e: snap.complianceBalanceGco2e,
      });
    }
    return out;
  }, [idList, routes, snapByRouteId]);

  const poolSum = useMemo(
    () => members.reduce((s, m) => s + m.complianceBalanceGco2e, 0),
    [members],
  );

  const allLoaded =
    selectedIds.size > 0 &&
    idList.every((_id, i) => {
      const q = complianceQueries[i];
      return q && !q.isLoading && q.data;
    });

  const reportingYear = useMemo(() => {
    if (!routes || idList.length === 0) return new Date().getFullYear();
    const years = idList
      .map((id) => routes.find((r) => r.id === id)?.year)
      .filter((y): y is number => typeof y === "number");
    return years.length ? Math.max(...years) : new Date().getFullYear();
  }, [routes, idList]);

  const poolMutation = useMutation({
    mutationFn: () =>
      api.postPool({
        reportingYear,
        members,
      }),
  });

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const poolOk = poolSum >= 0;
  const canCreate =
    allLoaded &&
    members.length > 0 &&
    poolOk &&
    !poolMutation.isPending;

  return (
    <div className="space-y-6">
      <div
        className={`inline-flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${
          selectedIds.size === 0
            ? "border-slate-800 bg-slate-900/40"
            : poolOk
              ? "border-emerald-700/60 bg-emerald-950/30"
              : "border-red-800/60 bg-red-950/20"
        }`}
      >
        <span className="text-sm font-medium text-slate-300">Pool Σ CB</span>
        <span
          className={`text-xl font-bold tabular-nums ${
            selectedIds.size === 0
              ? "text-slate-500"
              : poolOk
                ? "text-emerald-400"
                : "text-red-400"
          }`}
        >
          {selectedIds.size === 0
            ? "—"
            : poolSum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        {selectedIds.size > 0 && (
          <span className="text-xs text-slate-500">
            {poolOk ? "≥ 0 — allocation allowed" : "below 0 — cannot pool"}
          </span>
        )}
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-800 p-3">
        <p className="text-xs text-slate-500">
          Select routes (compliance CB fetched per route). Members use ship =
          vessel ID.
        </p>
        {routes?.map((r) => {
          const checked = selectedIds.has(r.id);
          const idx = idList.indexOf(r.id);
          const q = idx >= 0 ? complianceQueries[idx] : undefined;
          const snap = checked ? q?.data : undefined;
          const loading = checked && q?.isLoading;

          return (
            <label
              key={r.id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-900/80"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(r.id)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600"
              />
              <span className="font-mono text-sm text-slate-200">{r.id}</span>
              <span className="text-sm text-slate-400">{r.vesselId}</span>
              {checked && (
                <span className="ml-auto text-sm tabular-nums text-slate-300">
                  {loading
                    ? "…"
                    : snap
                      ? `${snap.complianceBalanceGco2e.toFixed(1)} gCO₂e`
                      : "—"}
                </span>
              )}
            </label>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!canCreate}
        onClick={() => poolMutation.mutate()}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Create pool
      </button>

      {poolMutation.isSuccess && (
        <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
          {JSON.stringify(poolMutation.data, null, 2)}
        </pre>
      )}
      {poolMutation.isError && (
        <p className="text-sm text-red-400">
          {poolMutation.error instanceof Error
            ? poolMutation.error.message
            : "Pool creation failed"}
        </p>
      )}
    </div>
  );
}
