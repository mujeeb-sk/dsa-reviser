import { useMemo } from "react";

export default function StatsBar({ total, revised, grouped }) {
  const stats = useMemo(() => {
    const cats = [];
    for (const [category, items] of grouped) {
      const done = items.filter((p) => revised.has(p.id)).length;
      cats.push({ category, total: items.length, done });
    }
    return cats;
  }, [grouped, revised]);

  const pct = total > 0 ? Math.round((revised.size / total) * 100) : 0;

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Overall progress */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-400">Progress</span>
          <div className="w-40 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {revised.size}/{total} ({pct}%)
          </span>
        </div>

        {/* Per-category pills (scrollable) */}
        <div className="flex-1 flex gap-2 overflow-x-auto py-1 pl-4 scrollbar-hide">
          {stats.map((s) => (
            <span
              key={s.category}
              className={`shrink-0 text-[11px] px-2 py-1 rounded-full border ${
                s.done === s.total && s.total > 0
                  ? "border-green-600/40 bg-green-900/20 text-green-400"
                  : "border-gray-700 bg-gray-800/50 text-gray-400"
              }`}
            >
              {s.category.replace("Algorithms — ", "").replace("Coding Exercises — ", "")}: {s.done}/{s.total}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
