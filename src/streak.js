// ── Streak tracking ──
// Stores an array of ISO date strings (YYYY-MM-DD) when user revised at least one problem.

const STORAGE_KEY = "dsa-streak-dates";

function loadDates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDates(dates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Record that the user revised something today */
export function recordActivity() {
  const dates = loadDates();
  const today = todayStr();
  if (!dates.includes(today)) {
    dates.push(today);
    // Keep last 365 days only
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const trimmed = dates.filter((d) => d >= cutoffStr);
    saveDates(trimmed);
  }
}

/** Calculate current streak (consecutive days ending today or yesterday) */
export function getStreak() {
  const dates = new Set(loadDates());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today counts
  let current = new Date(today);
  if (!dates.has(current.toISOString().slice(0, 10))) {
    // Maybe streak ended yesterday — still show it
    current.setDate(current.getDate() - 1);
    if (!dates.has(current.toISOString().slice(0, 10))) {
      return { current: 0, longest: getLongest(dates) };
    }
  }

  let streak = 0;
  while (dates.has(current.toISOString().slice(0, 10))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return { current: streak, longest: Math.max(streak, getLongest(dates)) };
}

function getLongest(dates) {
  if (dates.size === 0) return 0;
  const sorted = [...dates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else if (diff > 1) {
      run = 1;
    }
  }
  return longest;
}

/** Get activity dates for display */
export function getActivityDates() {
  return loadDates();
}
