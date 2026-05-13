import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import problems from "./problems.json";
import Sidebar from "./components/Sidebar";
import ProblemView from "./components/ProblemView";
import StatsBar from "./components/StatsBar";
import { recordActivity, getStreak } from "./streak";

// ── localStorage helpers ──

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** revised: { [id]: timestamp } */
function loadRevised() {
  const raw = loadJSON("dsa-revised", null);
  if (!raw) return {};
  // migrate from old Set-based format [id, id, ...]
  if (Array.isArray(raw)) {
    const obj = {};
    for (const id of raw) obj[id] = Date.now();
    saveJSON("dsa-revised", obj);
    return obj;
  }
  return raw;
}

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all"); // all | easy | medium | hard
  const [revised, setRevised] = useState(loadRevised);
  const [favorites, setFavorites] = useState(() => new Set(loadJSON("dsa-favorites", [])));
  const [notes, setNotes] = useState(() => loadJSON("dsa-notes", {}));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streak, setStreak] = useState(getStreak);
  const [randomPreview, setRandomPreview] = useState(null); // problem object for random preview modal

  const searchRef = useRef(null);

  // ── Revised ──
  const toggleRevised = useCallback((id) => {
    setRevised((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = Date.now();
        recordActivity();
        setStreak(getStreak());
      }
      saveJSON("dsa-revised", next);
      return next;
    });
  }, []);

  // ── Favorites ──
  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveJSON("dsa-favorites", [...next]);
      return next;
    });
  }, []);

  // ── Notes ──
  const updateNote = useCallback((id, text) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (text.trim()) next[id] = text;
      else delete next[id];
      saveJSON("dsa-notes", next);
      return next;
    });
  }, []);

  // ── Export / Import ──
  const exportData = useCallback(() => {
    const streakDates = JSON.parse(localStorage.getItem("dsa-streak-dates") || "[]");
    const data = {
      revised,
      favorites: [...favorites],
      notes,
      streakDates,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsa-reviser-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [revised, favorites, notes]);

  const importData = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.revised) {
          setRevised(data.revised);
          saveJSON("dsa-revised", data.revised);
        }
        if (data.favorites) {
          setFavorites(new Set(data.favorites));
          saveJSON("dsa-favorites", data.favorites);
        }
        if (data.notes) {
          setNotes(data.notes);
          saveJSON("dsa-notes", data.notes);
        }
        if (data.streakDates) {
          localStorage.setItem("dsa-streak-dates", JSON.stringify(data.streakDates));
          setStreak(getStreak());
        }
        alert("Import successful!");
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  }, []);

  // ── Grouping & filtering ──
  // Build a nested structure: topic → subcategory → [problems]
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of problems) {
      if (!map.has(p.topic)) map.set(p.topic, new Map());
      const subMap = map.get(p.topic);
      const subKey = p.subcategory || "";
      if (!subMap.has(subKey)) subMap.set(subKey, []);
      subMap.get(subKey).push(p);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const map = new Map();
    for (const [topic, subMap] of grouped) {
      const filteredSubs = new Map();
      for (const [sub, items] of subMap) {
        const hits = items.filter((p) => {
          if (difficultyFilter !== "all") {
            const d = (p.difficulty || "").toLowerCase();
            if (d !== difficultyFilter) return false;
          }
          if (q) {
            return (
              p.title.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.topic.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
            );
          }
          return true;
        });
        if (hits.length) filteredSubs.set(sub, hits);
      }
      if (filteredSubs.size > 0) map.set(topic, filteredSubs);
    }
    return map;
  }, [grouped, search, difficultyFilter]);

  /** Flat list of currently visible problem ids (for keyboard nav) */
  const flatIds = useMemo(() => {
    const ids = [];
    for (const subMap of filtered.values()) {
      for (const items of subMap.values()) {
        for (const p of items) ids.push(p.id);
      }
    }
    return ids;
  }, [filtered]);

  const selected = problems.find((p) => p.id === selectedId) || null;

  // ── Random problem picker (shows preview first) ──
  const pickRandom = useCallback(() => {
    const unrevised = problems.filter((p) => !revised[p.id]);
    const pool = unrevised.length > 0 ? unrevised : problems;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setRandomPreview(pick);
  }, [revised]);

  const openRandomProblem = useCallback(() => {
    if (randomPreview) {
      setSelectedId(randomPreview.id);
      setSidebarOpen(false);
      setRandomPreview(null);
    }
  }, [randomPreview]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function handleKey(e) {
      const tag = (e.target.tagName || "").toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || e.target.isContentEditable;

      // "/" to focus search (works always)
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Escape to blur search
      if (e.key === "Escape" && isInput) {
        e.target.blur();
        return;
      }

      if (isInput) return;

      // "r" to toggle revised
      if (e.key === "r" && selectedId) {
        e.preventDefault();
        toggleRevised(selectedId);
        return;
      }

      // "f" to toggle favorite
      if (e.key === "f" && selectedId) {
        e.preventDefault();
        toggleFavorite(selectedId);
        return;
      }

      // Arrow Up / Down or j / k to navigate
      if (["ArrowUp", "ArrowDown", "j", "k"].includes(e.key)) {
        e.preventDefault();
        const currentIdx = flatIds.indexOf(selectedId);
        let nextIdx;
        if (e.key === "ArrowDown" || e.key === "j") {
          nextIdx = currentIdx < flatIds.length - 1 ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : flatIds.length - 1;
        }
        setSelectedId(flatIds[nextIdx]);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, flatIds, toggleRevised, toggleFavorite]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-200">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-3 left-3 z-50 md:hidden bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        grouped={filtered}
        selectedId={selectedId}
        onSelect={(id) => { setSelectedId(id); setSidebarOpen(false); }}
        search={search}
        onSearch={setSearch}
        searchRef={searchRef}
        revised={revised}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        open={sidebarOpen}
        difficultyFilter={difficultyFilter}
        onDifficultyFilter={setDifficultyFilter}
        problems={problems}
      />

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <StatsBar
          total={problems.length}
          revised={revised}
          grouped={grouped}
          onPickRandom={pickRandom}
          onExport={exportData}
          onImport={importData}
          streak={streak}
        />
        {selected ? (
          <ProblemView
            problem={selected}
            revised={!!revised[selected.id]}
            revisedAt={revised[selected.id] || null}
            onToggleRevised={() => toggleRevised(selected.id)}
            favorited={favorites.has(selected.id)}
            onToggleFavorite={() => toggleFavorite(selected.id)}
            note={notes[selected.id] || ""}
            onUpdateNote={(text) => updateNote(selected.id, text)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 px-4">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-300">DSA Reviser</h2>
              <p>Select a problem from the sidebar to start revising</p>
              <p className="text-sm mt-4 text-gray-400 dark:text-gray-600">
                {problems.length} problems · {Object.keys(revised).length} revised
              </p>
              <div className="mt-6">
                <button
                  onClick={pickRandom}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  🎲 Pick Random Problem
                </button>
              </div>
              <p className="text-xs mt-8 text-gray-400 dark:text-gray-600">
                Shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">↑↓</kbd> navigate · <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">r</kbd> revised · <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">f</kbd> favorite · <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">/</kbd> search
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Random problem preview modal */}
      {randomPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRandomPreview(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  🎲 Random Problem
                </span>
                <button
                  onClick={() => setRandomPreview(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
                >
                  ✕
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                {randomPreview.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{randomPreview.category}</span>
                {randomPreview.difficulty && (
                  <>
                    <span>·</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      randomPreview.difficulty.toLowerCase() === "easy"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : randomPreview.difficulty.toLowerCase() === "medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                    }`}>
                      {randomPreview.difficulty}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {randomPreview.description && (
              <div className="p-5 border-b border-gray-200 dark:border-gray-800">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                  {randomPreview.description}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="p-5 flex items-center gap-3">
              <button
                onClick={openRandomProblem}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View Solution →
              </button>
              <button
                onClick={() => {
                  setRandomPreview(null);
                  pickRandom();
                }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700"
              >
                🎲 Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
