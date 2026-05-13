#!/usr/bin/env node

/**
 * sync.js — Scans the DSA repository and extracts all .cpp files
 * into a structured problems.json consumed by the React app.
 *
 * Usage:  node sync.js [path-to-dsa-repo]
 * Default repo path: ../DSA
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, basename, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DSA_ROOT = process.argv[2] || join(__dirname, "..", "DSA");
const OUT_FILE = join(__dirname, "src", "problems.json");

/** Recursively collect all .cpp files under a directory */
function collectFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, files);
    } else if (extname(entry) === ".cpp") {
      files.push(full);
    }
  }
  return files;
}

/** Turn a file-name slug into a readable title */
function slugToTitle(slug) {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bSll\b/g, "SLL")
    .replace(/\bDll\b/g, "DLL")
    .replace(/\bBt\b/g, "BT")
    .replace(/\bLlist\b/g, "Linked List");
}

/** Derive topic, subcategory and difficulty from the relative path */
function categorizePath(relPath) {
  // relPath examples:
  //   src/coding_exercises/arrays/easy/find_missing_number.cpp
  //   src/coding_exercises/linked_lists/FAQs/medium/detect_loop_sll.cpp
  //   src/algorithms/sorting/merge_sort.cpp
  const parts = relPath.split("/");

  // Remove "src" prefix
  const rest = parts.slice(1); // e.g. ["coding_exercises","arrays","easy","file.cpp"]

  let topic = "";
  let subcategory = "";
  let difficulty = "";

  if (rest[0] === "coding_exercises") {
    if (rest.length === 2) {
      // e.g. coding_exercises/helloWorld.cpp — file directly in coding_exercises
      topic = "Misc";
      subcategory = "";
      difficulty = "";
    } else {
      topic = slugToTitle(rest[1]); // "Arrays", "Linked Lists", "Trees", "Misc"

      if (rest.length === 3) {
        // e.g. trees/file.cpp — no subfolder
        subcategory = "";
        difficulty = "";
      } else if (rest.length === 4) {
        // e.g. arrays/easy/file.cpp
        subcategory = slugToTitle(rest[2]); // "Easy", "Medium", "Hard"
        difficulty = subcategory;
      } else if (rest.length === 5) {
        // e.g. linked_lists/FAQs/medium/file.cpp
        subcategory = `${slugToTitle(rest[2])} — ${slugToTitle(rest[3])}`;
        difficulty = slugToTitle(rest[3]);
      }
    }
  } else if (rest[0] === "algorithms") {
    topic = "Algorithms";
    subcategory = slugToTitle(rest[1]); // "Sorting", "Searching"
    difficulty = "";
  } else {
    topic = "Other";
    subcategory = "";
  }

  // Keep a combined category for backward compat
  const category = subcategory ? `${topic} — ${subcategory}` : topic;

  return { topic, subcategory, difficulty, category };
}

/** Extract the first block-comment as the problem description */
function extractDescription(code) {
  const match = code.match(/^\/\*([\s\S]*?)\*\//);
  if (!match) return "";
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*?\s?/, ""))
    .join("\n")
    .trim();
}

/** Remove the first block comment (description) from the displayed code */
function stripDescription(code) {
  // Remove the leading block comment and any blank lines right after it
  return code.replace(/^\/\*[\s\S]*?\*\/\s*\n?/, "").trimStart();
}

/**
 * Extract all approaches with their names and complexity analysis.
 *
 * Pattern: Each Solution/Solution2/... class has:
 *   - A comment like "Brute Force Approach:" or "Optimal Approach (name):"
 *   - A "Complexity Analysis" block with Time/Space lines (with reasoning)
 *
 * Returns an array of { name, time, timeReason, space, spaceReason }
 */
function extractApproaches(code) {
  const approaches = [];

  // Match all "Complexity Analysis" blocks — each belongs to a Solution class
  // We need to find each approach comment + its complexity block
  // Strategy: split by Solution class boundaries

  // Find all approach names: /* Brute Force Approach: ... */  or  /* Optimal Approach (...): ... */
  const approachRegex = /\/\*\s*((?:Brute\s+Force|Better|Optimal|Optimised|Optimized|Naive|Greedy|Recursive|Iterative|Alternative)[\s\S]*?Approach(?:\s*\([^)]*\))?)\s*[:—\-]\s*([\s\S]*?)\*\//gi;
  const complexityRegex = /\/\*\s*Complexity\s+Analysis\s*([\s\S]*?)\*\//gi;

  // Collect approach names with their positions
  const approachNames = [];
  let m;
  while ((m = approachRegex.exec(code)) !== null) {
    approachNames.push({ name: m[1].trim(), pos: m.index });
  }

  // Collect all complexity blocks with positions
  const complexityBlocks = [];
  while ((m = complexityRegex.exec(code)) !== null) {
    complexityBlocks.push({ text: m[1], pos: m.index });
  }

  // Match each approach to the next complexity block after it
  for (let i = 0; i < approachNames.length; i++) {
    const approach = approachNames[i];
    // Find the complexity block that comes after this approach
    const compBlock = complexityBlocks.find((c) => c.pos > approach.pos &&
      (i + 1 >= approachNames.length || c.pos < approachNames[i + 1].pos));

    let time = "";
    let space = "";

    if (compBlock) {
      const timeMatch = compBlock.text.match(
        /Time\s+Complexity\s*[:=\-—>]*\s*([\s\S]*?)(?=Space\s+Complexity|$)/i
      );
      const spaceMatch = compBlock.text.match(
        /Space\s+Complexity\s*[:=\-—>]*\s*([\s\S]*?)$/i
      );

      if (timeMatch) {
        time = timeMatch[1].trim().replace(/\*\/\s*$/, "").replace(/\n\s*/g, " ").trim();
      }
      if (spaceMatch) {
        space = spaceMatch[1].trim().replace(/\*\/\s*$/, "").replace(/\n\s*/g, " ").trim();
      }
    }

    approaches.push({
      name: approach.name,
      time,
      space,
    });
  }

  // If no named approaches found, fall back to extracting all complexity blocks
  if (approaches.length === 0 && complexityBlocks.length > 0) {
    for (const block of complexityBlocks) {
      const timeMatch = block.text.match(
        /Time\s+Complexity\s*[:=\-—>]*\s*([\s\S]*?)(?=Space\s+Complexity|$)/i
      );
      const spaceMatch = block.text.match(
        /Space\s+Complexity\s*[:=\-—>]*\s*([\s\S]*?)$/i
      );

      approaches.push({
        name: approaches.length === 0 ? "Solution" : `Solution ${approaches.length + 1}`,
        time: timeMatch ? timeMatch[1].trim().replace(/\*\/\s*$/, "").replace(/\n\s*/g, " ").trim() : "",
        space: spaceMatch ? spaceMatch[1].trim().replace(/\*\/\s*$/, "").replace(/\n\s*/g, " ").trim() : "",
      });
    }
  }

  return approaches;
}

// ─── Main ─────────────────────────────────────────────
const srcDir = join(DSA_ROOT, "src");
const files = collectFiles(srcDir);

const problems = files.map((filePath) => {
  const rawCode = readFileSync(filePath, "utf-8");
  const relPath = relative(DSA_ROOT, filePath);
  const slug = basename(filePath, ".cpp");
  const { topic, subcategory, difficulty, category } = categorizePath(relPath);
  const description = extractDescription(rawCode);
  const approaches = extractApproaches(rawCode);
  const code = stripDescription(rawCode);

  // Legacy single complexity (last/best approach) for backward compat
  const lastApproach = approaches[approaches.length - 1];
  const complexity = lastApproach
    ? { time: lastApproach.time, space: lastApproach.space }
    : { time: "", space: "" };

  return {
    id: slug,
    title: slugToTitle(slug),
    topic,
    subcategory,
    category,
    difficulty,
    description,
    approaches,
    complexity,
    code,
    filePath: relPath,
  };
});

// Sort: by category then title
problems.sort((a, b) =>
  a.category === b.category
    ? a.title.localeCompare(b.title)
    : a.category.localeCompare(b.category)
);

writeFileSync(OUT_FILE, JSON.stringify(problems, null, 2));
console.log(`✅  Synced ${problems.length} problems → ${OUT_FILE}`);
