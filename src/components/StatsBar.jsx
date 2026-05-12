import { useMemo, useRef } from "react";

export default function StatsBar({ total, revised, grouped, onPickRandom, onExport, onImport, streak }) {
  const fileRef = useRef(null);
  const revisedCount = Object.keys(revised).length;

  const stats = useMemo(() => {
    const cats = [];
    for (const [category, items] of grouped) {
      const done = items.filter((p) => !!revised[p.id]).length;
      cats.push({ category, total: items.length, done });
    }
    return cats;
  }, [grouped, revised]);

  const pct = total > 0 ? Math.round((revisedCount / total) * 100) : 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex items-center gap-1.5 shrink-0" title={`Longest streak: ${streak.longest} days`}>
          <span className="text-base">🔥</span>
          <span className={`text-sm font-bold ${streak.current > 0 ? "text-orange-500" : "text-gray-400 dark:text-gray-600"}`}>
            {streak.current}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-600">day{streak.current !== 1 ? "s" : ""}</span>
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 shrink-0" />

        {/* Overall progress */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            {revisedCount}/{total} ({pct}%)
          </span>
        </div>

        {/* Per-category pills (scrollable) */}
        <div className="flex-1 flex gap-2 overflow-x-auto py-1 pl-4 scrollbar-hide">
          {stats.map((s) => (
            <span
              key={s.category}
              className={`shrink-0 text-[11px] px-2 py-1 rounded-full border ${
                s.done === s.total && s.total > 0
                  ? "border-green-300 bg-green-50 text-green-700 dark:border-green-600/40 dark:bg-green-900/20 dark:text-green-400"
                  : "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
              }`}
            >
              {s.category.replace("Algorithms — ", "").replace("Coding Exercises — ", "")}: {s.done}/{s.total}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onPickRandom}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors
                       bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200
                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Pick a random unrevised problem"
          >
            🎲
          </button>
          <button
            onClick={onExport}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors
                       bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200
                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Export progress"
          >
            ↓
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors
                       bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200
                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Import progress"
          >
            ↑
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) onImport(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
