// Shared daily-reading target math, used by the read-tracker app and the
// home "weekly reading" widget so both compute the same chunked page target.

const DAILY_KEY = "read_tracker_daily";

export function readingTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Remaining days in a goal's span (inclusive of today).
export function readingRemainingDays(weekStart: string, weeks: number): number {
  const start = new Date(weekStart);
  const lastDay = new Date(start);
  lastDay.setDate(start.getDate() + 7 * Math.max(1, weeks || 1) - 1);
  lastDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((lastDay.getTime() - today.getTime()) / 86400000) + 1);
}

// Pages to read today: remaining pages from the day's baseline over the
// remaining days. Last day → exact remainder; earlier days → round up to 10.
export function readingDailyTarget(base: number, total: number, remainingDays: number): number {
  const remaining = Math.max(0, total - base);
  if (!(total > 0 && remaining > 0)) return 0;
  if (remainingDays <= 1) return remaining;
  const rounded = Math.ceil(remaining / remainingDays / 10) * 10;
  return Math.min(Math.max(10, rounded), remaining);
}

// Split today's target into ~30-page chunks, e.g. 80 -> [30, 30, 20].
export function readingChunks(target: number, chunk = 30): number[] {
  const chunks: number[] = [];
  let rem = target;
  while (rem > 0 && chunks.length < 12) {
    const c = Math.min(chunk, rem);
    chunks.push(c);
    rem -= c;
  }
  return chunks;
}

// Read (and lazily set) today's starting page for a book, persisted per-device.
// Shared key with the read-tracker page so both stay consistent through the day.
export function getReadingBaseline(bookId: string, currentPage: number): number {
  const today = readingTodayStr();
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    const log = raw ? JSON.parse(raw) : {};
    const entry = log[bookId];
    if (entry && entry.date === today) return entry.startPage;
    log[bookId] = { date: today, startPage: currentPage };
    localStorage.setItem(DAILY_KEY, JSON.stringify(log));
    return currentPage;
  } catch {
    return currentPage;
  }
}
