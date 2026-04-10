import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../infrastructure/api-client.js";

const TARGET = 89.3368;

function pctDiff(actual: number, target: number): number {
  return ((actual - target) / target) * 100;
}

export function CompareTab() {
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => api.getRoutes(),
  });

  const baseline = useMemo(
    () => routes?.find((r) => r.isBaseline) ?? routes?.[0],
    [routes],
  );

  const [compareId, setCompareId] = useState<string>("");

  const compared = useMemo(() => {
    if (!routes?.length) return undefined;
    const id = compareId || routes[0]!.id;
    return routes.find((r) => r.id === id) ?? routes[0];
  }, [routes, compareId]);

  const chartData = useMemo(() => {
    if (!compared) return [];
    const rows: { label: string; value: number; fill: string }[] = [
      {
        label: "Target (regulatory)",
        value: TARGET,
        fill: "#34d399",
      },
    ];
    if (baseline) {
      rows.push({
        label: `Baseline (${baseline.id})`,
        value: baseline.actualIntensityGco2ePerMj,
        fill: "#818cf8",
      });
    }
    rows.push({
      label: `Selected (${compared.id})`,
      value: compared.actualIntensityGco2ePerMj,
      fill: "#fbbf24",
    });
    return rows;
  }, [baseline, compared]);

  const diffPct = compared
    ? pctDiff(compared.actualIntensityGco2ePerMj, TARGET)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm text-slate-400">
          Compare route
          <select
            className="mt-1 block w-48 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={compared?.id ?? ""}
            onChange={(e) => setCompareId(e.target.value)}
          >
            {routes?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} — {r.vesselId}
              </option>
            ))}
          </select>
        </label>
        {diffPct !== null && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              vs target (89.3368)
            </p>
            <p
              className={`text-2xl font-semibold tabular-nums ${
                diffPct <= 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {diffPct >= 0 ? "+" : ""}
              {diffPct.toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500">
              Negative % means intensity below target (favourable).
            </p>
          </div>
        )}
      </div>

      <div className="h-80 w-full rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              interval={0}
              angle={-12}
              height={70}
              textAnchor="end"
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              domain={[0, "auto"]}
              label={{
                value: "gCO₂e/MJ",
                angle: -90,
                position: "insideLeft",
                fill: "#64748b",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
              }}
              formatter={(v: number) => [v.toFixed(4), "Intensity"]}
            />
            <ReferenceLine
              y={TARGET}
              stroke="#34d399"
              strokeDasharray="4 4"
              label={{ value: "Target", fill: "#34d399", fontSize: 11 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
