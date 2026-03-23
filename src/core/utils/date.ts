/**
 * Lightweight date utilities using only native Date + UTC arithmetic.
 * No moment.js, no luxon, no external dependencies.
 *
 * All functions operate in UTC to avoid timezone/DST drift.
 * Dates should be created at UTC midnight (via new Date('YYYY-MM-DD') or utcDate()).
 */

/** Creates a Date at UTC midnight for the given year/month(0-based)/day. */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

/** Returns a new Date clamped to UTC midnight (strips time component). */
export function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Returns the number of days in the given month (0-based) of the given year. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Returns the last day of the month for the given date (UTC). */
export function lastDayOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

/** Adds `n` days to a date and returns a new Date at UTC midnight. */
export function addDays(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
}

/** Adds `n` months to a date and returns a new Date, clamped to month end. */
export function addMonths(d: Date, n: number): Date {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + n;
  const day = d.getUTCDate();
  // Use day 0 of month+1 to clamp to last day of intended month
  const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, maxDay)));
}

/** Adds `n` years to a date, clamped for Feb 29 on non-leap years. */
export function addYears(d: Date, n: number): Date {
  const year = d.getUTCFullYear() + n;
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, maxDay)));
}

/**
 * Returns the week-index difference between two dates, anchored on Sunday.
 * Replicates: cur.startOf('week').diff(initialDate.startOf('week'), 'weeks')
 */
export function weeksDiff(anchor: Date, candidate: Date): number {
  const anchorSow = startOfSundayWeek(anchor);
  const candidateSow = startOfSundayWeek(candidate);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.round((candidateSow.getTime() - anchorSow.getTime()) / msPerWeek);
}

/** Returns the start of the week (Sunday) for a given date (UTC). */
export function startOfSundayWeek(d: Date): Date {
  const sod = startOfDay(d);
  return addDays(sod, -sod.getUTCDay()); // rewind to Sunday
}

/**
 * Returns the months elapsed between two dates, measured month-to-month.
 * Replicates: nextMonth.diff(initialDate, 'months')
 */
export function monthsDiff(anchor: Date, candidate: Date): number {
  return (
    (candidate.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    (candidate.getUTCMonth() - anchor.getUTCMonth())
  );
}

/** Returns true if two dates fall on the same UTC calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Returns true if `candidate` is strictly before `bound` at day precision (UTC). */
export function isBeforeDay(candidate: Date, bound: Date): boolean {
  return startOfDay(candidate) < startOfDay(bound);
}

/** Returns true if `candidate` is strictly after `bound` at day precision (UTC). */
export function isAfterDay(candidate: Date, bound: Date): boolean {
  return startOfDay(candidate) > startOfDay(bound);
}

/** Formats a Date as "YYYY-MM-DD" using UTC fields. */
export function toDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Sets a specific time-of-day on a cloned date (local time, for RBC display).
 * @param d     - base date
 * @param hhmm  - "HH:mm" in 24-hour format
 */
export function setTimeOfDay(d: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const out = new Date(d);
  out.setHours(h ?? 0, m ?? 0, 0, 0);
  return out;
}

/**
 * Returns the Nth occurrence (0-based ordinalIndex) of a weekday within a month.
 * e.g. ordinalWeekdayInMonth(2024, 0, 1, 0) → 1st Monday of January 2024
 * @param weekday      0=Sun…6=Sat (UTC)
 * @param ordinalIndex 0-based
 */
export function ordinalWeekdayInMonth(
  year: number,
  month: number,
  weekday: number,
  ordinalIndex: number,
): Date | null {
  const days: Date[] = [];
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day++) {
    const candidate = new Date(Date.UTC(year, month, day));
    if (candidate.getUTCDay() === weekday) days.push(candidate);
  }
  if (ordinalIndex >= days.length) return null;
  return days[ordinalIndex] ?? null;
}

/** Returns the last occurrence of a weekday within a month (UTC). */
export function lastWeekdayInMonth(year: number, month: number, weekday: number): Date {
  // Start from last day of month and backtrack
  const last = new Date(Date.UTC(year, month + 1, 0));
  while (last.getUTCDay() !== weekday) {
    last.setUTCDate(last.getUTCDate() - 1);
  }
  return last;
}

/**
 * Returns the 0-based ordinal position of a date's weekday within its month.
 * e.g. "3rd Monday" → 2
 */
export function getOrdinalIndex(d: Date): number {
  return Math.floor((d.getUTCDate() - 1) / 7);
}
