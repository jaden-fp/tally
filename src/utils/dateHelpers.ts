import type { Entry } from '../types';

// =============================================================================
// Internal helpers (not exported)
// =============================================================================

/**
 * Parse a "YYYY-MM-DD" string as a local-timezone Date at midnight.
 *
 * DO NOT use `new Date(dateStr)` — the ISO date-only form is parsed as UTC
 * midnight by the spec, which shifts the date by the user's UTC offset.
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a local Date as "YYYY-MM-DD" using local date parts.
 */
function localDateToString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add `n` calendar days to a local date string and return a new "YYYY-MM-DD".
 */
function addDaysLocal(dateStr: string, n: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return localDateToString(d);
}

// =============================================================================
// Public API
// =============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const MONTH_ABBREVS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// Day labels in ISO order: Monday … Sunday
const ISO_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

// -----------------------------------------------------------------------------
// Date accessors
// -----------------------------------------------------------------------------

/**
 * Returns today's date as "YYYY-MM-DD" in the user's **local** timezone.
 *
 * Never uses `Date.toISOString()` which would return UTC and could produce
 * yesterday's date for users ahead of UTC at midnight.
 */
export function getTodayString(): string {
  return localDateToString(new Date());
}

/**
 * Formats a "YYYY-MM-DD" date string for human display.
 *
 * @example formatDateDisplay('2026-03-15') → "Mar 15, 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns the full weekday name for a "YYYY-MM-DD" string.
 *
 * @example formatDayOfWeek('2026-03-15') → "Sunday"
 */
export function formatDayOfWeek(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

// -----------------------------------------------------------------------------
// Calendar math
// -----------------------------------------------------------------------------

/**
 * Returns the number of days in a given month, correctly accounting for
 * leap years.
 *
 * @param year  Full four-digit year (e.g. 2026)
 * @param month 0-indexed month (0 = January, 11 = December)
 */
export function getDaysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of the current month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns the weekday index (0 = Sunday, 6 = Saturday) of the first day of
 * a given month — suitable for building calendar grids.
 *
 * @param year  Full four-digit year
 * @param month 0-indexed month
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Returns the absolute number of calendar days between two "YYYY-MM-DD"
 * strings. Order does not matter; the result is always ≥ 0.
 *
 * @example getDaysBetween('2026-01-01', '2026-01-10') → 9
 */
export function getDaysBetween(dateStr1: string, dateStr2: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const d1 = parseLocalDate(dateStr1).getTime();
  const d2 = parseLocalDate(dateStr2).getTime();
  return Math.round(Math.abs(d2 - d1) / msPerDay);
}

// -----------------------------------------------------------------------------
// Month / day-of-week name lookups
// -----------------------------------------------------------------------------

/**
 * Returns the full month name for a 0-indexed month.
 *
 * @example getMonthName(0) → "January"
 * @example getMonthName(11) → "December"
 */
export function getMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] ?? '';
}

/**
 * Returns the abbreviated month name for a 0-indexed month.
 *
 * @example getMonthAbbrev(0) → "Jan"
 * @example getMonthAbbrev(11) → "Dec"
 */
export function getMonthAbbrev(monthIndex: number): string {
  return MONTH_ABBREVS[monthIndex] ?? '';
}

// -----------------------------------------------------------------------------
// Entry aggregation
// -----------------------------------------------------------------------------

/**
 * Groups an array of entries by month (0 = January … 11 = December).
 *
 * All 12 month keys are always present in the returned Map — months with no
 * entries map to an empty array. The year component of each entry's date is
 * ignored, so pass a year-scoped slice if year isolation is needed.
 *
 * @param entries Flat array of habit entries.
 * @returns A Map keyed 0–11, each value being the entries for that month.
 */
export function groupEntriesByMonth(entries: Entry[]): Map<number, Entry[]> {
  const map = new Map<number, Entry[]>();
  for (let i = 0; i < 12; i++) map.set(i, []);

  for (const entry of entries) {
    const month = parseInt(entry.date.split('-')[1], 10) - 1; // '2026-03-15' → 2
    if (month >= 0 && month < 12) {
      map.get(month)!.push(entry);
    }
  }

  return map;
}

// -----------------------------------------------------------------------------
// Streak calculations
// -----------------------------------------------------------------------------

/** Build a date → total-count map from an entry array. */
function buildCountMap(entries: Entry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of entries) {
    map.set(entry.date, (map.get(entry.date) ?? 0) + entry.count);
  }
  return map;
}

/**
 * Counts consecutive calendar days with a positive count going **backwards**
 * from `fromDate` (defaults to today in local time).
 *
 * Future dates are never counted — if `fromDate` is in the future the
 * function caps it at today before walking backwards.
 *
 * Behaviour on the starting date:
 * - If `fromDate` itself has count === 0 (or no entry), returns 0.
 * - If `fromDate` has count > 0, it is included in the streak and the walk
 *   continues to the day before, and so on.
 *
 * @param entries  All habit entries to consider.
 * @param fromDate Optional starting date ("YYYY-MM-DD"). Defaults to today.
 * @returns Number of consecutive tracked days ending on `fromDate`.
 */
export function calculateStreak(entries: Entry[], fromDate?: string): number {
  if (entries.length === 0) return 0;

  const today = getTodayString();
  // Cap future start dates at today
  let cursor = fromDate && fromDate < today ? fromDate : today;

  const countMap = buildCountMap(entries);
  let streak = 0;

  while (true) {
    const count = countMap.get(cursor) ?? 0;
    if (count <= 0) break;
    streak++;
    cursor = addDaysLocal(cursor, -1);
  }

  return streak;
}

/**
 * Finds the longest consecutive streak (in calendar days with count > 0)
 * anywhere in the entry history.
 *
 * Future-dated entries are excluded from consideration.
 *
 * @param entries All habit entries to consider.
 * @returns Length of the best streak ever recorded.
 */
export function calculateBestStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;

  const today = getTodayString();

  // Collect every date that has a positive total count, excluding future
  const activeDates = new Set<string>();
  const countMap = buildCountMap(entries);
  for (const [date, count] of countMap) {
    if (count > 0 && date <= today) activeDates.add(date);
  }

  if (activeDates.size === 0) return 0;

  const sorted = Array.from(activeDates).sort(); // lexicographic = chronological
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    // Check whether sorted[i] is exactly 1 day after sorted[i-1]
    const diff = getDaysBetween(sorted[i - 1], sorted[i]);
    if (diff === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

// -----------------------------------------------------------------------------
// Day-of-week analysis
// -----------------------------------------------------------------------------

/**
 * Calculates the average habit count for each day of the week (Monday–Sunday).
 *
 * "Average" is defined as: (total count recorded on all occurrences of that
 * weekday) ÷ (number of distinct dates with that weekday present in `entries`).
 * Days with no entries at all return 0.
 *
 * Multiple entries for the same date are summed before averaging.
 *
 * @param entries All habit entries to analyse.
 * @returns Array of 7 objects `{ day, average }` in ISO order Mon → Sun.
 */
export function dayOfWeekAverage(
  entries: Entry[],
): { day: string; average: number }[] {
  // Aggregate counts per date first (handles duplicate entry objects per date)
  const dateCountMap = buildCountMap(entries);

  const totals = new Array<number>(7).fill(0);
  const occurrences = new Array<number>(7).fill(0);

  for (const [date, count] of dateCountMap) {
    const d = parseLocalDate(date);
    // getDay(): 0=Sun … 6=Sat → convert to ISO index 0=Mon … 6=Sun
    const isoIndex = (d.getDay() + 6) % 7;
    totals[isoIndex] += count;
    occurrences[isoIndex]++;
  }

  return ISO_DAYS.map((day, i) => ({
    day,
    average: occurrences[i] > 0 ? totals[i] / occurrences[i] : 0,
  }));
}
