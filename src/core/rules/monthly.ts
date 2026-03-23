/**
 * Monthly recurrence expansion.
 *
 * Ported and generalised from:
 *   backend/resolvers/.../monthlyRepetition/genMonthlyRepetition.js
 *   backend/resolvers/.../monthlyRepetition/utils/defTargetDay.js
 *
 * Supports 4 monthly patterns:
 *   - day         → same calendar day each month, clamped to month end
 *   - lastDay     → last day of the month
 *   - weekday     → Nth weekday of the month (e.g. 1st Monday)
 *   - lastWeekday → last occurrence of a specific weekday (e.g. last Friday)
 */

import type { RecurrenceRule, ExpandedDate, ExpandOptions } from '../types.js';
import {
  monthsDiff,
  daysInMonth,
  lastWeekdayInMonth,
  ordinalWeekdayInMonth,
  getOrdinalIndex,
  isAfterDay,
  isSameDay,
  toDateKey,
} from '../utils/date.js';

/**
 * Calculates the target Date for a given month offset from the rule's startDate.
 */
function targetDateForMonth(rule: RecurrenceRule, year: number, month: number): Date | null {
  const { startDate, monthly } = rule;
  if (!monthly) return null;

  switch (monthly.pattern) {
    case 'day': {
      const desiredDay = startDate.getUTCDate();
      const maxDay = daysInMonth(year, month);
      return new Date(Date.UTC(year, month, Math.min(desiredDay, maxDay)));
    }
    case 'lastDay':
      return new Date(Date.UTC(year, month + 1, 0));
    case 'weekday': {
      const weekday = startDate.getUTCDay();
      const ordinalIndex = getOrdinalIndex(startDate);
      return ordinalWeekdayInMonth(year, month, weekday, ordinalIndex);
    }
    case 'lastWeekday': {
      const weekday = startDate.getUTCDay();
      return lastWeekdayInMonth(year, month, weekday);
    }
  }
}

export function expandMonthly(
  rule: RecurrenceRule,
  options: ExpandOptions,
  occurrenceCountBefore: number,
): ExpandedDate[] {
  const { rangeStart, rangeEnd, maxOccurrences = 5000, excludeDates = [] } = options;
  const { startDate, interval, end, monthly } = rule;

  if (!monthly) return [];

  const excludeSet = new Set(excludeDates.map(toDateKey));
  const results: ExpandedDate[] = [];

  const startYear = startDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth();

  // Fast-forward: skip to the first candidate month at or after rangeStart,
  // aligned to a valid interval step from startDate.
  const mDiffToRange = monthsDiff(startDate, rangeStart);
  const firstOffset = Math.max(0, Math.floor(mDiffToRange / interval) * interval);

  let occurrenceIndex = 0;
  let offset = 0;
  let safetyCounter = 0;

  // Walk from offset 0 counting occurrences so "after N" end works correctly,
  // but skip collecting until we reach the range.
  while (safetyCounter < maxOccurrences) {
    safetyCounter++;

    const totalMonth = startMonth + offset;
    const targetYear = startYear + Math.floor(totalMonth / 12);
    const targetMonth = ((totalMonth % 12) + 12) % 12;

    const targetDate = targetDateForMonth(rule, targetYear, targetMonth);

    if (!targetDate) {
      offset += interval;
      continue;
    }

    // targetDate must be on or after startDate
    if (isAfterDay(startDate, targetDate) && !isSameDay(startDate, targetDate)) {
      offset += interval;
      continue;
    }

    // Check series end conditions
    if (end.type === 'after' && occurrenceIndex >= end.occurrences) break;
    if (end.type === 'on' && isAfterDay(targetDate, end.date)) break;

    // Stop once past rangeEnd
    if (isAfterDay(targetDate, rangeEnd)) break;

    // Collect if within range (skip fast-forwarded months silently)
    if (offset >= firstOffset) {
      const inRange =
        (isSameDay(targetDate, rangeStart) || isAfterDay(targetDate, rangeStart)) &&
        (isSameDay(targetDate, rangeEnd) || !isAfterDay(targetDate, rangeEnd));

      if (inRange && !excludeSet.has(toDateKey(targetDate))) {
        results.push({
          date: new Date(targetDate),
          occurrenceIndex: occurrenceCountBefore + occurrenceIndex,
        });
      }
    }

    occurrenceIndex++;
    offset += interval;
  }

  return results;
}
