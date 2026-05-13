import { useEffect, useRef, useState, useCallback } from "react";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";

hljs.registerLanguage("cpp", cpp);

function timeAgo(ts) {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ProblemView({
  problem,
  revised,
  revisedAt,
  onToggleRevised,
  favorited,
  onToggleFavorite,
  note,
  onUpdateNote,
}) {
  const codeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [noteOpen, setNoteOpen] = useState(!!note);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted");
      hljs.highlightElement(codeRef.current);
    }
  }, [problem.code]);

  // Reset note visibility when switching problems
  useEffect(() => {
    setNoteOpen(!!note);
  }, [problem.id]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(problem.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [problem.code]);

  const isStale = revised && revisedAt && (Date.now() - revisedAt > 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 pl-8 md:pl-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{problem.title}</h2>
              <button
                onClick={onToggleFavorite}
                className={`text-lg transition-colors shrink-0 ${
                  favorited ? "text-amber-400" : "text-gray-300 hover:text-amber-400 dark:text-gray-600 dark:hover:text-amber-400"
                }`}
                title={favorited ? "Remove from favorites (f)" : "Add to favorites (f)"}
              >
                {favorited ? "★" : "☆"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate max-w-[150px] sm:max-w-none">{problem.category}</span>
              {problem.difficulty && (
                <>
                  <span>·</span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      problem.difficulty.toLowerCase() === "easy"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : problem.difficulty.toLowerCase() === "medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </>
              )}
              <span>·</span>
              <span className="text-gray-400 dark:text-gray-500 truncate hidden sm:inline">{problem.filePath}</span>
              {revisedAt && (
                <>
                  <span>·</span>
                  <span className={`${isStale ? "text-orange-500" : "text-green-500"}`}>
                    revised {timeAgo(revisedAt)}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onToggleRevised}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              revised
                ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 dark:bg-green-600/20 dark:text-green-400 dark:border-green-600/40 dark:hover:bg-green-600/30"
                : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            }`}
            title="Toggle revised (r)"
          >
            {revised ? "✓ Revised" : "Mark as Revised"}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Spaced repetition nudge */}
        {isStale && (
          <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
            <span className="text-orange-500 text-lg">⏰</span>
            <span className="text-orange-700 dark:text-orange-300">
              You revised this {timeAgo(revisedAt)} — consider going through it again!
            </span>
          </div>
        )}

        {/* Description */}
        {problem.description && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Problem Description
            </h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 font-sans leading-relaxed">
              {problem.description}
            </pre>
          </section>
        )}

        {/* Approaches & Complexity */}
        {problem.approaches && problem.approaches.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {problem.approaches.length > 1 ? "Approaches & Complexity" : "Complexity Analysis"}
            </h3>
            <div className="space-y-3">
              {problem.approaches.map((approach, idx) => {
                const nameL = approach.name.toLowerCase();
                const isBrute = nameL.includes("brute");
                const isOptimal = nameL.includes("optimal") || nameL.includes("optimised") || nameL.includes("optimized");
                const accentColor = isBrute
                  ? "border-l-orange-400"
                  : isOptimal
                  ? "border-l-green-500"
                  : "border-l-blue-400";
                const labelBg = isBrute
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                  : isOptimal
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";

                return (
                  <div
                    key={idx}
                    className={`border-l-4 ${accentColor} bg-gray-50 dark:bg-gray-900 rounded-r-lg p-4 border border-gray-200 dark:border-gray-800`}
                  >
                    {problem.approaches.length > 1 && (
                      <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-2 ${labelBg}`}>
                        {approach.name}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {approach.time && (
                        <div className="flex-1">
                          <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                            Time
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">{approach.time}</div>
                        </div>
                      )}
                      {approach.space && (
                        <div className="flex-1">
                          <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                            Space
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400">{approach.space}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Fallback: legacy single complexity (if no approaches extracted) */}
        {(!problem.approaches || problem.approaches.length === 0) &&
          (problem.complexity.time || problem.complexity.space) && (
          <section className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {problem.complexity.time && (
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Time Complexity
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-mono">{problem.complexity.time}</div>
              </div>
            )}
            {problem.complexity.space && (
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Space Complexity
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400 font-mono">{problem.complexity.space}</div>
              </div>
            )}
          </section>
        )}

        {/* Notes */}
        <section>
          <button
            onClick={() => setNoteOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${noteOpen ? "rotate-90" : ""}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4l8 6-8 6V4z" />
            </svg>
            Notes {note && <span className="text-blue-500 text-xs normal-case font-normal">(has notes)</span>}
          </button>
          {noteOpen && (
            <textarea
              value={note}
              onChange={(e) => onUpdateNote(e.target.value)}
              placeholder="Write your observations, tricks, edge cases..."
              className="w-full h-32 px-4 py-3 text-sm rounded-lg border resize-y
                         bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400
                         dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:placeholder-gray-600
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          )}
        </section>

        {/* Code */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Source Code
            </h3>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors
                         bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
              <code ref={codeRef} className="language-cpp">
                {problem.code}
              </code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
