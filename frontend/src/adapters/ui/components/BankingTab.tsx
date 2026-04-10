import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../infrastructure/api-client.js";

export function BankingTab() {
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => api.getRoutes(),
  });

  const [routeId, setRouteId] = useState<string>("");
  const [amountInput, setAmountInput] = useState("");
  const [initialSurplus, setInitialSurplus] = useState<number | null>(null);
  const [bankedSession, setBankedSession] = useState(0);

  useEffect(() => {
    setInitialSurplus(null);
    setBankedSession(0);
    setAmountInput("");
  }, [routeId]);

  const { data: snap, isFetching } = useQuery({
    queryKey: ["compliance", routeId],
    queryFn: () => api.getComplianceCb(routeId),
    enabled: Boolean(routeId),
  });

  useEffect(() => {
    if (snap && initialSurplus === null) {
      setInitialSurplus(snap.complianceBalanceGco2e);
    }
  }, [snap, initialSurplus]);

  const cbBefore = initialSurplus;
  const applied = bankedSession;
  const cbAfter =
    cbBefore !== null ? cbBefore - applied : null;

  const surplusBlocked = cbBefore !== null && cbBefore <= 0;

  const bankMutation = useMutation({
    mutationFn: async () => {
      if (!snap) throw new Error("Load a compliance snapshot first");
      const amount = Number(amountInput);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a positive amount");
      }
      return api.postBank({
        shipId: snap.shipId,
        year: snap.year,
        amountGco2e: amount,
      });
    },
    onSuccess: (data) => {
      setBankedSession((s) => s + data.bankedAmountGco2e);
      setAmountInput("");
    },
  });

  const canSubmit =
    Boolean(snap) &&
    !surplusBlocked &&
    !bankMutation.isPending &&
    Number(amountInput) > 0 &&
    initialSurplus !== null &&
    Number(amountInput) <= initialSurplus - bankedSession;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <label className="block text-sm text-slate-400">
          Route (loads compliance snapshot)
          <select
            className="mt-1 block w-64 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
          >
            <option value="">Select…</option>
            {routes?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} — {r.vesselId}
              </option>
            ))}
          </select>
        </label>
      </div>

      {routeId && (
        <p className="text-xs text-slate-500">
          {isFetching ? "Refreshing snapshot…" : "Snapshot ready."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="CB_before (gCO₂e)" value={cbBefore} accent="text-slate-100" />
        <Kpi
          label="Applied (session banked)"
          value={applied}
          accent="text-indigo-400"
        />
        <Kpi
          label="CB_after (remaining)"
          value={cbAfter}
          accent="text-emerald-400"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm text-slate-400">
          Amount to bank (gCO₂e)
          <input
            type="number"
            min={0}
            step="any"
            disabled={surplusBlocked || !snap}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="mt-1 block w-48 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 disabled:opacity-40"
          />
        </label>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => bankMutation.mutate()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Bank surplus
        </button>
      </div>

      {surplusBlocked && snap && (
        <p className="text-sm text-amber-400">
          Compliance balance is not a surplus — banking is disabled.
        </p>
      )}
      {bankMutation.isError && (
        <p className="text-sm text-red-400">
          {bankMutation.error instanceof Error
            ? bankMutation.error.message
            : "Bank failed"}
        </p>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>
        {value === null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}
