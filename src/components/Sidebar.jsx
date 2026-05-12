import { useMemo } from "react";

/** Collapsible category sections in the sidebar */
export default function Sidebar({
  grouped,
  selectedId,
  onSelect,
  search,
  onSearch,
  revised,
  open,
}) {
  const categories = useMemo(() => [...grouped.entries()], [grouped]);

  return (
    <aside
      className={`
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-200
        fixed md:static z-40 inset-y-0 left-0
        w-80 bg-gray-900 border-r border-gray-800 flex flex-col
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-xl">📚</span> DSA Reviser
        </h1>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search problems..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-sm text-gray-200 placeholder-gray-500
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Problem list */}
      <nav className="flex-1 overflow-y-auto">
        {categories.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No problems match your search.</p>
        )}
        {categories.map(([category, items]) => (
          <CategoryGroup
            key={category}
            category={category}
            items={items}
            selectedId={selectedId}
            onSelect={onSelect}
            revised={revised}
          />
        ))}
      </nav>
    </aside>
  );
}

function CategoryGroup({ category, items, selectedId, onSelect, revised }) {
  const revisedCount = items.filter((p) => revised.has(p.id)).length;

  return (
    <details className="group" open>
      <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer
                          bg-gray-850 hover:bg-gray-800 border-b border-gray-800
                          text-xs font-semibold uppercase tracking-wider text-gray-400
                          select-none sticky top-0 z-10 bg-gray-900">
        <span className="flex items-center gap-2">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4l8 6-8 6V4z" />
          </svg>
          {category}
        </span>
        <span className="text-[10px] font-normal text-gray-500">
          {revisedCount}/{items.length}
        </span>
      </summary>

      <ul>
        {items.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p.id)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2
                         transition-colors border-b border-gray-800/50
                ${
                  selectedId === p.id
                    ? "bg-blue-600/15 text-blue-400 border-l-2 border-l-blue-500"
                    : "hover:bg-gray-800/60 text-gray-300"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  revised.has(p.id) ? "bg-green-500" : "bg-gray-600"
                }`}
              />
              <span className="truncate">{p.title}</span>
              {p.difficulty && (
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                    p.difficulty.toLowerCase() === "easy"
                      ? "bg-green-900/40 text-green-400"
                      : p.difficulty.toLowerCase() === "medium"
                      ? "bg-yellow-900/40 text-yellow-400"
                      : "bg-red-900/40 text-red-400"
                  }`}
                >
                  {p.difficulty}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
