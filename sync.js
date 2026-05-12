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

/** Extract complexity info from inline comments */
function extractComplexity(code) {
  const timeMatch = code.match(
    /Time\s+Complexity\s*[:=\-—>]*\s*(.+)/i
  );
  const spaceMatch = code.match(
    /Space\s+Complexity\s*[:=\-—>]*\s*(.+)/i
  );
  return {
    time: timeMatch ? timeMatch[1].trim().replace(/\*\/\s*$/, "").trim() : "",
    space: spaceMatch ? spaceMatch[1].trim().replace(/\*\/\s*$/, "").trim() : "",
  };
}

// ─── Main ─────────────────────────────────────────────
const srcDir = join(DSA_ROOT, "src");
const files = collectFiles(srcDir);

const problems = files.map((filePath) => {
  const code = readFileSync(filePath, "utf-8");
  const relPath = relative(DSA_ROOT, filePath);
  const slug = basename(filePath, ".cpp");
  const { topic, subcategory, difficulty, category } = categorizePath(relPath);
  const description = extractDescription(code);
  const complexity = extractComplexity(code);

  return {
    id: slug,
    title: slugToTitle(slug),
    topic,
    subcategory,
    category,
    difficulty,
    description,
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
