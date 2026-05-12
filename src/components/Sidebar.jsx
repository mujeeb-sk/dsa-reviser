import { useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

/** Collapsible category sections in the sidebar */
export default function Sidebar({
  grouped,
  selectedId,
  onSelect,
  search,
  onSearch,
  searchRef,
  revised,
  favorites,
  onToggleFavorite,
  open,
  difficultyFilter,
  onDifficultyFilter,
  problems,
}) {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = useMemo(() => {
    if (!showFavoritesOnly) return [...grouped.entries()];
    // Filter to favorites only
    const map = new Map();
    for (const [cat, items] of grouped) {
      const favs = items.filter((p) => favorites.has(p.id));
      if (favs.length) map.set(cat, favs);
    }
    return [...map.entries()];
  }, [grouped, showFavoritesOnly, favorites]);

  return (
    <aside
      className={`
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-200
        fixed md:static z-40 inset-y-0 left-0
        w-80 bg-white border-r border-gray-200 flex flex-col
        dark:bg-gray-900 dark:border-gray-800
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-xl">📚</span> DSA Reviser
          </h1>
          <ThemeToggle />
        </div>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search problems... ( / )"
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg
                     text-sm text-gray-800 placeholder-gray-400
                     dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {/* Difficulty filter + Favorites toggle */}
        <div className="flex items-center gap-1.5">
          {["all", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => onDifficultyFilter(d)}
              className={`text-[11px] px-2 py-1 rounded-full border transition-colors capitalize ${
                difficultyFilter === d
                  ? d === "easy"
                    ? "border-green-400 bg-green-100 text-green-700 dark:border-green-500 dark:bg-green-900/40 dark:text-green-400"
                    : d === "medium"
                    ? "border-yellow-400 bg-yellow-100 text-yellow-700 dark:border-yellow-500 dark:bg-yellow-900/40 dark:text-yellow-400"
                    : d === "hard"
                    ? "border-red-400 bg-red-100 text-red-700 dark:border-red-500 dark:bg-red-900/40 dark:text-red-400"
                    : "border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-400"
                  : "border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {d}
            </button>
          ))}

          <div className="flex-1" />

          <button
            onClick={() => setShowFavoritesOnly((v) => !v)}
            className={`text-sm px-2 py-1 rounded-full border transition-colors ${
              showFavoritesOnly
                ? "border-amber-400 bg-amber-100 text-amber-600 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
                : "border-gray-300 text-gray-400 hover:text-amber-500 dark:border-gray-700 dark:hover:text-amber-400"
            }`}
            title="Show favorites only"
          >
            ★
          </button>
        </div>
      </div>

      {/* Problem list */}
      <nav className="flex-1 overflow-y-auto">
        {categories.length === 0 && (
          <p className="p-4 text-sm text-gray-400 dark:text-gray-500">
            {showFavoritesOnly ? "No favorites yet." : "No problems match your search."}
          </p>
        )}
        {categories.map(([category, items]) => (
          <CategoryGroup
            key={category}
            category={category}
            items={items}
            selectedId={selectedId}
            onSelect={onSelect}
            revised={revised}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </nav>
    </aside>
  );
}

function CategoryGroup({ category, items, selectedId, onSelect, revised, favorites, onToggleFavorite }) {
  const revisedCount = items.filter((p) => !!revised[p.id]).length;

  return (
    <details className="group" open>
      <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer
                          hover:bg-gray-100 border-b border-gray-200 bg-gray-50
                          dark:hover:bg-gray-800 dark:border-gray-800 dark:bg-gray-900
                          text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400
                          select-none sticky top-0 z-10">
        <span className="flex items-center gap-2">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4l8 6-8 6V4z" />
          </svg>
          {category}
        </span>
        <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">
          {revisedCount}/{items.length}
        </span>
      </summary>

      <ul>
        {items.map((p) => {
          const isRevised = !!revised[p.id];
          const revisedAt = revised[p.id] || null;
          const isStale = isRevised && revisedAt && (Date.now() - revisedAt > SEVEN_DAYS);

          return (
            <li key={p.id} className="group/item relative">
              <button
                onClick={() => onSelect(p.id)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2
                           transition-colors border-b border-gray-100 dark:border-gray-800/50
                  ${
                    selectedId === p.id
                      ? "bg-blue-50 text-blue-600 border-l-2 border-l-blue-500 dark:bg-blue-600/15 dark:text-blue-400"
                      : "hover:bg-gray-50 text-gray-700 dark:hover:bg-gray-800/60 dark:text-gray-300"
                  }`}
              >
                {/* Revised indicator — dot with stale highlighting */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isStale
                      ? "bg-orange-400 ring-2 ring-orange-200 dark:ring-orange-800"
                      : isRevised
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  title={
                    isStale
                      ? "Revised 7+ days ago — consider re-revising"
                      : isRevised
                      ? "Revised"
                      : "Not revised"
                  }
                />
                {/* Favorite star */}
                {favorites.has(p.id) && (
                  <span className="text-amber-400 text-xs shrink-0">★</span>
                )}
                <span className="truncate">{p.title}</span>
                {p.difficulty && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      p.difficulty.toLowerCase() === "easy"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : p.difficulty.toLowerCase() === "medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                    }`}
                  >
                    {p.difficulty}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
