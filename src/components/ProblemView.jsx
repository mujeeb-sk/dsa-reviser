import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";

hljs.registerLanguage("cpp", cpp);

export default function ProblemView({ problem, revised, onToggleRevised }) {
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted");
      hljs.highlightElement(codeRef.current);
    }
  }, [problem.code]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{problem.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>{problem.category}</span>
              {problem.difficulty && (
                <>
                  <span>·</span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      problem.difficulty.toLowerCase() === "easy"
                        ? "bg-green-900/40 text-green-400"
                        : problem.difficulty.toLowerCase() === "medium"
                        ? "bg-yellow-900/40 text-yellow-400"
                        : "bg-red-900/40 text-red-400"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </>
              )}
              <span>·</span>
              <span className="text-gray-500 truncate">{problem.filePath}</span>
            </div>
          </div>

          <button
            onClick={onToggleRevised}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              revised
                ? "bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30"
                : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
            }`}
          >
            {revised ? "✓ Revised" : "Mark as Revised"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Description */}
        {problem.description && (
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Problem Description
            </h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900 rounded-lg p-4 border border-gray-800 font-sans leading-relaxed">
              {problem.description}
            </pre>
          </section>
        )}

        {/* Complexity */}
        {(problem.complexity.time || problem.complexity.space) && (
          <section className="flex gap-4">
            {problem.complexity.time && (
              <div className="flex-1 bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Time Complexity
                </div>
                <div className="text-sm text-blue-400 font-mono">{problem.complexity.time}</div>
              </div>
            )}
            {problem.complexity.space && (
              <div className="flex-1 bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Space Complexity
                </div>
                <div className="text-sm text-purple-400 font-mono">{problem.complexity.space}</div>
              </div>
            )}
          </section>
        )}

        {/* Code */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Source Code
          </h3>
          <div className="rounded-lg overflow-hidden border border-gray-800">
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
