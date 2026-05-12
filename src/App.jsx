import { useState, useMemo, useCallback } from "react";
import problems from "./problems.json";
import Sidebar from "./components/Sidebar";
import ProblemView from "./components/ProblemView";
import StatsBar from "./components/StatsBar";

/** Load revised set from localStorage */
function loadRevised() {
  try {
    const raw = localStorage.getItem("dsa-revised");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [revised, setRevised] = useState(loadRevised);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /** Persist revised set */
  const toggleRevised = useCallback(
    (id) => {
      setRevised((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem("dsa-revised", JSON.stringify([...next]));
        return next;
      });
    },
    []
  );

  /** Group problems by category */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of problems) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category).push(p);
    }
    return map;
  }, []);

  /** Filter by search */
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const map = new Map();
    for (const [cat, items] of grouped) {
      const hits = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
      if (hits.length) map.set(cat, hits);
    }
    return map;
  }, [grouped, search]);

  const selected = problems.find((p) => p.id === selectedId) || null;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-3 left-3 z-50 md:hidden bg-gray-800 p-2 rounded-lg"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <Sidebar
        grouped={filtered}
        selectedId={selectedId}
        onSelect={(id) => { setSelectedId(id); setSidebarOpen(false); }}
        search={search}
        onSearch={setSearch}
        revised={revised}
        open={sidebarOpen}
      />

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <StatsBar total={problems.length} revised={revised} grouped={grouped} />
        {selected ? (
          <ProblemView
            problem={selected}
            revised={revised.has(selected.id)}
            onToggleRevised={() => toggleRevised(selected.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">DSA Reviser</h2>
              <p>Select a problem from the sidebar to start revising</p>
              <p className="text-sm mt-4 text-gray-600">
                {problems.length} problems · {revised.size} revised
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
