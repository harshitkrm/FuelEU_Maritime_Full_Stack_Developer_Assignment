import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../infrastructure/api-client.js";

export function RoutesTab() {
  const qc = useQueryClient();
  const { data: routes, isLoading, error } = useQuery({
    queryKey: ["routes"],
    queryFn: () => api.getRoutes(),
  });

  const baselineMutation = useMutation({
    mutationFn: (routeId: string) => api.setBaseline(routeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routes"] }),
  });

  if (isLoading) {
    return (
      <p className="text-slate-400" role="status">
        Loading routes…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-red-400" role="alert">
        {error instanceof Error ? error.message : "Failed to load routes"}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-300">
              ID
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">
              Vessel
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">
              Fuel
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-300">
              Year
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-300">
              Fuel (t)
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-300">
              Intensity (gCO₂e/MJ)
            </th>
            <th className="px-4 py-3 text-center font-medium text-slate-300">
              Baseline
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-300">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {routes?.map((r) => (
            <tr key={r.id} className="hover:bg-slate-900/50">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-200">
                {r.id}
              </td>
              <td className="px-4 py-3 text-slate-200">{r.vesselId}</td>
              <td className="px-4 py-3 text-slate-300">{r.fuelType}</td>
              <td className="px-4 py-3 text-right text-slate-300">{r.year}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                {r.fuelConsumptionT}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                {r.actualIntensityGco2ePerMj.toFixed(4)}
              </td>
              <td className="px-4 py-3 text-center">
                {r.isBaseline ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                    Yes
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  disabled={
                    baselineMutation.isPending ||
                    r.isBaseline
                  }
                  onClick={() => baselineMutation.mutate(r.id)}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {r.isBaseline ? "Baseline" : "Set baseline"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
