import { useState } from "react";
import { BankingTab } from "./components/BankingTab.js";
import { CompareTab } from "./components/CompareTab.js";
import { PoolingTab } from "./components/PoolingTab.js";
import { RoutesTab } from "./components/RoutesTab.js";

const tabs = [
  { id: "routes", label: "Routes" },
  { id: "compare", label: "Compare" },
  { id: "banking", label: "Banking" },
  { id: "pooling", label: "Pooling" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function App() {
  const [tab, setTab] = useState<TabId>("routes");

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-6 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          FuelEU Maritime Compliance
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Routes, intensity comparison, Article 20 banking, Article 21 pooling.
        </p>
      </header>

      <nav className="border-b border-slate-800 px-4 sm:px-8">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-t-md px-4 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-slate-900 text-white ring-1 ring-slate-700 ring-b-0"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-4 py-8 sm:px-8">
        {tab === "routes" && <RoutesTab />}
        {tab === "compare" && <CompareTab />}
        {tab === "banking" && <BankingTab />}
        {tab === "pooling" && <PoolingTab />}
      </main>
    </div>
  );
}
